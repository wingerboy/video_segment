import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { API_URL, AUTH_CONFIG } from '../config';

// 配置axios默认设置
axios.defaults.withCredentials = true;

// 创建简单的事件总线
export const UserEvents = {
  // 事件类型
  PROFILE_UPDATED: 'PROFILE_UPDATED',
  BALANCE_UPDATED: 'BALANCE_UPDATED',
  MODEL_PRICE_UPDATED: 'MODEL_PRICE_UPDATED',
  USER_STATUS_CHANGED: 'USER_STATUS_CHANGED',  // 添加用户状态更新事件
  
  // 事件监听器存储
  listeners: {},
  
  // 添加监听器
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    
    // 返回取消订阅函数
    return () => {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    };
  },
  
  // 触发事件
  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }
};

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // 跟踪最后一次更新时间，用于避免重复获取
  const [lastUpdate, setLastUpdate] = useState(0);
  // 定期检查用户状态的定时器ID
  const [statusCheckInterval, setStatusCheckInterval] = useState(null);
  // 用户是否已被标记为禁用
  const [userBanned, setUserBanned] = useState(false);

  // 设置axios请求拦截器，在用户被禁用后阻止请求
  useEffect(() => {
    // 添加请求拦截器
    const interceptor = axios.interceptors.request.use(
      (config) => {
        // 如果用户已被标记为禁用，取消所有请求
        if (userBanned) {
          console.log('用户已被禁用，拦截请求:', config.url);
          // 创建一个取消令牌
          const source = axios.CancelToken.source();
          config.cancelToken = source.token;
          // 立即取消请求
          source.cancel('User is banned');
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 清理函数
    return () => {
      // 移除拦截器
      axios.interceptors.request.eject(interceptor);
    };
  }, [userBanned]);

  // 组件挂载时初始化用户信息和状态检查
  useEffect(() => {
    // 组件挂载时，从localStorage中恢复用户信息
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    const user = localStorage.getItem(AUTH_CONFIG.USER_INFO_KEY)
      ? JSON.parse(localStorage.getItem(AUTH_CONFIG.USER_INFO_KEY))
      : null;

    if (token && user) {
      // 如果用户已被禁用，直接执行登出，不设置状态检查
      if (user.userStatus === 'banned') {
        console.log('用户已被禁用，跳过设置状态检查');
        setUserBanned(true);
        logout();
        alert('您的账号已被禁用，请联系管理员');
      } else {
        setCurrentUser(user);
        setupAuthHeader(token);
        // 设置定期检查用户状态
        setupStatusCheck();
      }
    }
    setLoading(false);

    // 监听用户状态变更事件
    const unsubscribe = UserEvents.on(UserEvents.USER_STATUS_CHANGED, handleUserStatusChanged);
    
    // 组件卸载时清理
    return () => {
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
        setStatusCheckInterval(null);
      }
      unsubscribe();
    };
  }, []);

  // 设置定期检查用户状态
  const setupStatusCheck = () => {
    // 清除现有定时器
    if (statusCheckInterval) {
      clearInterval(statusCheckInterval);
      setStatusCheckInterval(null);
    }
    
    // 如果没有当前用户，则不设置状态检查
    if (!currentUser) {
      console.log('无当前用户，不设置状态检查');
      return;
    }
    
    console.log('设置用户状态检查，间隔30秒');
    // 设置新的定时器，每30秒检查一次状态
    const intervalId = setInterval(async () => {
      try {
        // 只在用户已登录时执行检查
        if (currentUser) {
          const response = await axios.get(`${API_URL}/auth/me`);
          // 如果状态已更新为禁用，则强制登出
          if (response.data.user.userStatus === 'banned') {
            console.log('用户已被禁用，强制登出');
            clearStatusCheckAndLogout();
            // 显示提示消息
            alert('您的账号已被禁用，请联系管理员');
          }
        } else {
          // 如果用户已登出，清除定时器
          clearInterval(intervalId);
          setStatusCheckInterval(null);
          console.log('用户已登出，清除状态检查');
        }
      } catch (error) {
        console.error('检查用户状态失败:', error);
        // 如果返回403和特定code，意味着用户已被禁用
        if (error.response?.status === 403 && error.response?.data?.code === 'USER_BANNED') {
          console.log('API检查返回用户已被禁用，强制登出');
          clearStatusCheckAndLogout();
          // 显示提示消息
          alert('您的账号已被禁用，请联系管理员');
        }
      }
    }, 30000); // 30秒检查一次
    
    setStatusCheckInterval(intervalId);
  };

  // 处理用户状态变更事件
  const handleUserStatusChanged = (data) => {
    // 只处理当前登录用户的状态变更
    if (currentUser && data.userId === currentUser.id && data.status === 'banned') {
      console.log('收到用户禁用事件，强制登出:', data);
      // 强制登出
      clearStatusCheckAndLogout();
      // 显示提示消息
      alert('您的账号已被管理员禁用');
    }
  };

  // 清除状态检查定时器并登出
  const clearStatusCheckAndLogout = () => {
    // 先标记用户为禁用状态，阻止新的请求
    setUserBanned(true);
    // 清除定时器，避免登出后又重新设置
    if (statusCheckInterval) {
      clearInterval(statusCheckInterval);
      setStatusCheckInterval(null);
    }
    // 然后登出
    logout();
  };

  const login = async (email, password) => {
    try {
      setError('');
      setLoading(true);
      // 重置禁用状态
      setUserBanned(false);
      
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      
      if (response.data && response.data.token) {
        // 检查用户状态
        if (response.data.user.userStatus === 'banned') {
          setUserBanned(true);
          setError('您的账号已被禁用，请联系管理员');
          return null;
        }
        
        localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, response.data.token);
        localStorage.setItem(AUTH_CONFIG.USER_INFO_KEY, JSON.stringify(response.data.user));
        setCurrentUser(response.data.user);
        setupAuthHeader(response.data.token);
        // 登录成功后设置状态检查
        setupStatusCheck();
        return response.data;
      } else {
        throw new Error('登录响应中未包含Token');
      }
    } catch (err) {
      console.error('登录失败:', err);
      setError(err.response?.data?.message || '登录失败，请重试');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setError('');
      setLoading(true);
      const response = await axios.post(`${API_URL}/auth/register`, userData);
      
      if (response.data && response.data.token) {
        localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, response.data.token);
        localStorage.setItem(AUTH_CONFIG.USER_INFO_KEY, JSON.stringify(response.data.user));
        setCurrentUser(response.data.user);
        setupAuthHeader(response.data.token);
        return response.data;
      } else {
        throw new Error('注册响应中未包含Token');
      }
    } catch (err) {
      console.error('注册失败:', err);
      setError(err.response?.data?.message || '注册失败，请重试');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // 确保清除定时器
    if (statusCheckInterval) {
      clearInterval(statusCheckInterval);
      setStatusCheckInterval(null);
    }
    localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
    localStorage.removeItem(AUTH_CONFIG.USER_INFO_KEY);
    setCurrentUser(null);
    // 清除请求头中的认证信息
    delete axios.defaults.headers.common['Authorization'];
  };

  // 设置请求头中的认证Token
  const setupAuthHeader = (token) => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  // 获取当前用户信息 - 添加防抖功能避免频繁调用
  const getCurrentUser = async (force = false) => {
    try {
      // 如果没有用户登录，直接返回null
      if (!localStorage.getItem(AUTH_CONFIG.TOKEN_KEY)) {
        return null;
      }
      
      // 如果距离上次更新不到1秒且不是强制更新，则使用缓存数据
      const now = Date.now();
      if (!force && now - lastUpdate < 1000 && currentUser) {
        return currentUser;
      }
      
      setLoading(true);
      const response = await axios.get(`${API_URL}/auth/me`);
      const updatedUser = response.data.user;
      
      // 检查用户是否被禁用
      if (updatedUser.userStatus === 'banned') {
        console.log('getCurrentUser检测到用户已被禁用，强制登出');
        clearStatusCheckAndLogout();
        alert('您的账号已被禁用，请联系管理员');
        return null;
      }
      
      // 更新用户状态
      setCurrentUser(updatedUser);
      // 更新最后更新时间
      setLastUpdate(now);
      // 更新localStorage中的用户信息
      localStorage.setItem(AUTH_CONFIG.USER_INFO_KEY, JSON.stringify(updatedUser));
      
      return updatedUser;
    } catch (err) {
      console.error('获取用户信息失败:', err);
      // 如果返回401或403，可能是token已过期或用户被禁用
      if (err.response?.status === 401 || 
         (err.response?.status === 403 && err.response?.data?.code === 'USER_BANNED')) {
        console.log('API响应表明用户无效或已禁用，执行登出');
        clearStatusCheckAndLogout();
        
        // 如果是被禁用，显示提示
        if (err.response?.status === 403 && err.response?.data?.code === 'USER_BANNED') {
          alert('您的账号已被禁用，请联系管理员');
        }
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 添加更新用户资料的方法
  const updateProfile = async (profileData) => {
    try {
      setError(null);
      const response = await axios.put(`${API_URL}/auth/profile`, profileData);
      const updatedUser = response.data.user;
      
      // 更新状态
      setCurrentUser(updatedUser);
      setLastUpdate(Date.now());
      localStorage.setItem(AUTH_CONFIG.USER_INFO_KEY, JSON.stringify(updatedUser));
      
      // 触发资料更新事件
      UserEvents.emit(UserEvents.PROFILE_UPDATED, updatedUser);
      
      return updatedUser;
    } catch (error) {
      setError(error.response?.data?.message || '更新失败');
      throw error;
    }
  };
  
  // 更新用户余额 - 专门用于充值、消费等场景
  const updateUserBalance = async (newBalance, source = '') => {
    if (!currentUser) return null;
    
    try {
      // 更新本地状态而不发送请求
      const updatedUser = { 
        ...currentUser, 
        balance: newBalance 
      };
      
      setCurrentUser(updatedUser);
      setLastUpdate(Date.now());
      localStorage.setItem(AUTH_CONFIG.USER_INFO_KEY, JSON.stringify(updatedUser));
      
      // 触发余额更新事件
      UserEvents.emit(UserEvents.BALANCE_UPDATED, {
        newBalance,
        source,
        user: updatedUser
      });
      
      return updatedUser;
    } catch (error) {
      console.error('更新余额失败:', error);
      throw error;
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    login,
    register,
    logout,
    getCurrentUser,
    updateProfile,
    updateUserBalance, // 新增方法
    lastUpdate
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};