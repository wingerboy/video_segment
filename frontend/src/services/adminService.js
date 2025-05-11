import axios from 'axios';
import { API_URL, AUTH_CONFIG, ENV_CONFIG } from '../config';

// 创建axios实例
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 添加调试日志
console.log('API服务配置:', {
  API_URL,
  baseURL: API_URL,
  环境变量BaseURL: ENV_CONFIG.API_BASE_URL,
  apiURL环境变量: ENV_CONFIG.API_URL
});

// 请求拦截器添加token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 用户管理相关API
export const getAllUsers = async () => {
  try {
    const response = await api.get('/admin/users');
    return response.data;
  } catch (error) {
    console.error('获取用户列表失败:', error);
    throw error;
  }
};

export const updateUserRole = async (userId, role) => {
  try {
    const response = await api.put(`/admin/users/${userId}/role`, { role });
    return response.data;
  } catch (error) {
    console.error('更新用户角色失败:', error);
    throw error;
  }
};

export const updateUserStatus = async (userId, userStatus) => {
  try {
    const response = await api.put(`/admin/users/${userId}/status`, { userStatus });
    return response.data;
  } catch (error) {
    console.error('更新用户状态失败:', error);
    throw error;
  }
};

export const rechargeAccount = async (userId, amount, paymentId = null, description = '') => {
  try {
    const response = await api.post(`/admin/users/${userId}/recharge`, {
      amount,
      paymentId,
      description
    });
    return response.data;
  } catch (error) {
    console.error('账户充值失败:', error);
    throw error;
  }
};

// AI服务接口管理相关API
export const getAllInterfaces = async () => {
  try {
    const response = await api.get('/admin/interfaces');
    return response.data;
  } catch (error) {
    console.error('获取接口列表失败:', error);
    throw error;
  }
};

export const addInterface = async (interfaceAddress, isActive = true) => {
  try {
    const response = await api.post('/admin/interfaces', {
      interfaceAddress,
      status: isActive ? 'idle' : 'offline'
    });
    return response.data;
  } catch (error) {
    console.error('添加接口失败:', error);
    throw error;
  }
};

export const updateInterfaceStatus = async (interfaceId, status) => {
  try {
    const response = await api.put(`/admin/interfaces/${interfaceId}/status`, { 
      status 
    });
    return response.data;
  } catch (error) {
    console.error('更新接口状态失败:', error);
    throw error;
  }
};

export const deleteInterface = async (interfaceId) => {
  try {
    const response = await api.delete(`/admin/interfaces/${interfaceId}`);
    return response.data;
  } catch (error) {
    console.error('删除接口失败:', error);
    throw error;
  }
};

// 任务统计相关API
export const getTaskStats = async (params) => {
  try {
    const response = await api.get('/admin/stats/tasks', { params });
    return response.data;
  } catch (error) {
    console.error('获取任务统计失败:', error);
    throw error;
  }
};

export const getUserStats = async (params) => {
  try {
    const response = await api.get('/admin/stats/users', { params });
    return response.data;
  } catch (error) {
    console.error('获取用户统计失败:', error);
    throw error;
  }
};

// 模型管理相关API
export const getAllModels = async () => {
  try {
    const response = await api.get('/admin/models');
    return response.data;
  } catch (error) {
    console.error('获取模型列表失败:', error);
    throw error;
  }
};

export const addModel = async (modelData) => {
  try {
    const response = await api.post('/admin/models', modelData);
    return response.data;
  } catch (error) {
    console.error('添加模型失败:', error);
    throw error;
  }
};

export const updateModel = async (modelId, modelData) => {
  try {
    const response = await api.put(`/admin/models/${modelId}`, modelData);
    return response.data;
  } catch (error) {
    console.error('更新模型失败:', error);
    throw error;
  }
};

export const deleteModel = async (modelId) => {
  try {
    const response = await api.delete(`/admin/models/${modelId}`);
    return response.data;
  } catch (error) {
    console.error('删除模型失败:', error);
    throw error;
  }
};

// 任务管理相关API
export const getAllTasks = async (status) => {
  try {
    const url = status ? `/admin/tasks?status=${status}` : '/admin/tasks';
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('获取任务列表失败:', error);
    throw error;
  }
};

export const getTaskById = async (taskId) => {
  try {
    const response = await api.get(`/admin/tasks/${taskId}`);
    return response.data;
  } catch (error) {
    console.error('获取任务详情失败:', error);
    throw error;
  }
};

export const updateTask = async (taskId, taskData) => {
  try {
    const response = await api.put(`/admin/tasks/${taskId}`, taskData);
    return response.data;
  } catch (error) {
    console.error('更新任务失败:', error);
    throw error;
  }
};

export const deleteTask = async (taskId) => {
  try {
    const response = await api.delete(`/admin/tasks/${taskId}`);
    return response.data;
  } catch (error) {
    console.error('删除任务失败:', error);
    throw error;
  }
}; 