import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { API_URL, AUTH_CONFIG } from '../config';

// 配置axios默认设置
axios.defaults.withCredentials = true;

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // 组件挂载时，从localStorage中恢复用户信息
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    const user = localStorage.getItem(AUTH_CONFIG.USER_INFO_KEY)
      ? JSON.parse(localStorage.getItem(AUTH_CONFIG.USER_INFO_KEY))
      : null;

    if (token && user) {
      setCurrentUser(user);
      setupAuthHeader(token);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      setError('');
      setLoading(true);
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      
      if (response.data && response.data.token) {
        localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, response.data.token);
        localStorage.setItem(AUTH_CONFIG.USER_INFO_KEY, JSON.stringify(response.data.user));
        setCurrentUser(response.data.user);
        setupAuthHeader(response.data.token);
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

  // 获取当前用户信息
  const getCurrentUser = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/auth/me`);
      const updatedUser = response.data.user;
      setCurrentUser(updatedUser);
      // 更新localStorage中的用户信息
      localStorage.setItem(AUTH_CONFIG.USER_INFO_KEY, JSON.stringify(updatedUser));
      return updatedUser;
    } catch (err) {
      console.error('获取用户信息失败:', err);
      if (err.response?.status === 401) {
        // Token可能过期，注销用户
        logout();
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
      setCurrentUser(response.data.user);
      return response.data.user;
    } catch (error) {
      setError(error.response?.data?.message || '更新失败');
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
    updateProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};