import axios from 'axios';
import { API_URL, API_URL_JAVA } from '../config';

// 创建axios实例
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 创建Java API的axios实例
const apiJava = axios.create({
  baseURL: API_URL_JAVA,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 为两个API实例添加请求拦截器，处理认证
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiJava.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * 创建视频处理任务 (Node.js API)
 * @param {string} videoId 视频ID
 * @param {Object} options 任务选项
 * @returns {Promise<Object>} 任务信息
 */
export const createTask = async (videoId, options) => {
  try {
    const response = await api.post('/tasks/create', {
      videoId,
      ...options
    });
    return response.data;
  } catch (error) {
    console.error('创建任务失败:', error);
    throw error;
  }
};

/**
 * 创建视频处理任务 (Java API)
 * @param {Object} params 任务参数
 * @returns {Promise<Object>} 任务信息
 */
export const createTaskV2 = async (params) => {
  try {
    const formData = new FormData();
    // 将params对象中的每个属性添加到formData
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        // 特殊处理videoId和backgroundId，确保是数字
        if (key === 'videoId' || key === 'backgroundId') {
          formData.append(key, Number(params[key]));
        } else {
          formData.append(key, params[key]);
        }
      }
    });

    const response = await apiJava.post('/task/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    if(response?.data?.code !== 0){
      throw new Error(response?.data?.msg || '创建任务失败');
    }

    return response.data;
  } catch (error) {
    console.error('创建任务失败:', error);
    throw error;
  }
};

/**
 * 获取任务详情
 * @param {string} taskId 任务ID
 * @returns {Promise<Object>} 任务详情
 */
export const getTaskById = async (taskId) => {
  try {
    const response = await api.get(`/tasks/user/${taskId}`);
    return response.data;
  } catch (error) {
    console.error('获取任务详情失败:', error);
    throw error;
  }
};

/**
 * 获取任务状态
 * @param {string} taskId 任务ID
 * @returns {Promise<Object>} 任务状态信息
 */
export const getTaskStatus = async (taskId) => {
  try {
    const response = await api.get(`/tasks/status/${taskId}`);
    return response.data;
  } catch (error) {
    console.error('获取任务状态失败:', error);
    throw error;
  }
};

/**
 * 获取所有任务 (Node.js API)
 * @returns {Promise<Array>} 任务列表
 */
export const getAllTasks = async () => {
  try {
    const response = await api.get('/tasks/user');
    // 确保返回数组
    return Array.isArray(response.data) ? response.data : (response.data?.tasks || []);
  } catch (error) {
    console.error('获取任务列表失败:', error);
    throw error;
  }
};

/**
 * 获取所有任务 (Java API)
 * @param {Object} params 查询参数
 * @returns {Promise<Array>} 任务列表
 */
export const getAllTasksV2 = async (params) => {
  try {
    const {data} = await apiJava.post('/task/list', params);

    if(data?.code !== 0){
      throw new Error(data?.msg || '获取任务列表失败');
    }

    // 确保返回数组
    return data?.data || [];
  } catch (error) {
    console.error('获取任务列表失败:', error);
    throw error;
  }
};

/**
 * 取消任务
 * @param {string} taskId 任务ID
 * @returns {Promise<Object>} 操作结果
 */
export const cancelTask = async (taskId) => {
  try {
    const response = await api.delete(`/tasks/cancel/${taskId}`);
    return response.data;
  } catch (error) {
    console.error('取消任务失败:', error);
    throw error;
  }
};

/**
 * 获取模型使用统计 (管理员)
 * @returns {Promise<Array>} 模型使用统计
 */
export const getModelUsageStats = async () => {
  try {
    const response = await api.get('/tasks/admin/models');
    return response.data.modelUsages || [];
  } catch (error) {
    console.error('获取模型使用统计失败:', error);
    throw error;
  }
};

/**
 * 获取接口使用统计 (管理员)
 * @returns {Promise<Array>} 接口使用统计
 */
export const getInterfaceUsageStats = async () => {
  try {
    const response = await api.get('/tasks/admin/interfaces');
    return response.data.interfaceUsages || [];
  } catch (error) {
    console.error('获取接口使用统计失败:', error);
    throw error;
  }
};

export default {
  createTask,
  createTaskV2,
  getTaskById,
  getTaskStatus,
  getAllTasks,
  getAllTasksV2,
  cancelTask,
  getModelUsageStats,
  getInterfaceUsageStats
}; 