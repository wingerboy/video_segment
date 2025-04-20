import React, { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { API_URL } from '../config';

// 配置axios默认设置
axios.defaults.withCredentials = true;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 获取用户资料的方法 - 使用useCallback包装
  const getUserProfile = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/me`);
      setCurrentUser(response.data.user);
      setLoading(false);
    } catch (error) {
      console.error('Error getting user profile:', error);
      logout();
    }
  }, []);

  // 检查token是否有效
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // 检查token是否过期
        const decodedToken = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        
        if (decodedToken.exp < currentTime) {
          // Token已过期
          logout();
        } else {
          // 为所有请求设置auth头
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // 获取用户资料
          getUserProfile();
        }
      } catch (error) {
        console.error('Token validation error:', error);
        logout();
      }
    } else {
      setLoading(false);
    }
  }, [getUserProfile]);

  // Register a new user
  const register = async (username, email, password) => {
    try {
      setError(null);
      const response = await axios.post(`${API_URL}/auth/register`, {
        username,
        email,
        password
      });
      
      const { token, user } = response.data;
      
      // Save token to localStorage
      localStorage.setItem('token', token);
      
      // Set auth header for all requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Set current user
      setCurrentUser(user);
      
      return user;
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed');
      throw error;
    }
  };

  // Login a user
  const login = async (email, password) => {
    try {
      setError(null);
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });
      
      const { token, user } = response.data;
      
      // Save token to localStorage
      localStorage.setItem('token', token);
      
      // Set auth header for all requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Set current user
      setCurrentUser(user);
      
      return user;
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed');
      throw error;
    }
  };

  // Logout a user
  const logout = () => {
    // Remove token from localStorage
    localStorage.removeItem('token');
    
    // Remove auth header
    delete axios.defaults.headers.common['Authorization'];
    
    // Clear current user
    setCurrentUser(null);
    setLoading(false);
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

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        error,
        register,
        login,
        logout,
        updateProfile // 添加新方法
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};