import axios from 'axios';
import CryptoJS from 'crypto-js';

// 从环境变量获取API URL，默认为localhost:5001
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001';

// 创建axios实例
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器添加token
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

// 获取完整URL
export const getFullUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}/${path}`;
};

// 获取所有视频
export const getAllVideos = async () => {
  try {
    const response = await api.get('/videos');
    // 确保返回数组
    return Array.isArray(response.data) ? response.data : (response.data?.videos || []);
  } catch (error) {
    console.error('获取视频列表失败:', error);
    throw error;
  }
};

// 获取单个视频详情
export const getVideoById = async (id) => {
  try {
    const response = await api.get(`/videos/${id}`);
    return response.data;
  } catch (error) {
    console.error('获取视频详情失败:', error);
    throw error;
  }
};

// 计算文件MD5（用于检查是否已存在）
export const calculateMD5 = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function (e) {
      const buffer = e.target.result;
      const wordArray = CryptoJS.lib.WordArray.create(buffer);
      const hash = CryptoJS.MD5(wordArray).toString();
      resolve(hash);
    };
    reader.onerror = function (e) {
      reject(e);
    };
    reader.readAsArrayBuffer(file);
  });
};

// 检查视频是否已存在
export const checkVideoExists = async (md5Hash) => {
  try {
    const response = await api.get(`/videos/check/${md5Hash}`);
    return response.data;
  } catch (error) {
    // 如果返回404，则表示视频不存在
    if (error.response && error.response.status === 404) {
      return { exists: false };
    }
    console.error('检查视频失败:', error);
    throw error;
  }
};

// 检查背景图是否已存在
export const checkBackgroundExists = async (md5Hash) => {
  try {
    const response = await api.get(`/backgrounds/check/${md5Hash}`);
    return response.data;
  } catch (error) {
    // 如果返回404，则表示背景图不存在
    if (error.response && error.response.status === 404) {
      return { exists: false };
    }
    console.error('检查背景图失败:', error);
    throw error;
  }
};

// 上传视频文件
export const uploadVideo = async (file, name, onProgress) => {
  try {
    const formData = new FormData();
    formData.append('video', file);
    if (name) {
      formData.append('name', name);
    }
    
    const response = await api.post('/videos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        if (onProgress && typeof onProgress === 'function') {
          onProgress(percentCompleted);
        }
      }
    });
    console.log('上传视频成功:', response.data);
    return response.data;
  } catch (error) {
    console.error('上传视频失败:', error);
    throw error;
  }
};

// 上传背景图片
export const uploadBackgroundImage = async (videoId, backgroundId) => {
  try {
    // const formData = new FormData();
    // formData.append('image', file);
    
    const response = await api.put(`/videos/${videoId}/background`, {backgroundId});
    
    return response.data;
  } catch (error) {
    console.error('上传背景图片失败:', error);
    throw error;
  }
};

// 开始视频分割处理
export const startVideoSegmentation = async (videoId, modelId) => {
  try {
    const response = await api.post(`/videos/${videoId}/segment`, { modelId });
    return response.data;
  } catch (error) {
    console.error('视频分割处理失败:', error);
    throw error;
  }
};

// 创建视频处理任务
export const createTask = async (videoId, options) => {
  try {
    const response = await api.post('/tasks', {
      videoId,
      ...options
    });
    return response.data;
  } catch (error) {
    console.error('创建任务失败:', error);
    throw error;
  }
};

// 获取任务详情
export const getTaskById = async (taskId) => {
  try {
    const response = await api.get(`/tasks/${taskId}`);
    return response.data;
  } catch (error) {
    console.error('获取任务详情失败:', error);
    throw error;
  }
};

// 获取任务状态
export const getTaskStatus = async (taskId) => {
  try {
    const response = await api.get(`/tasks/${taskId}/status`);
    return response.data;
  } catch (error) {
    console.error('获取任务状态失败:', error);
    throw error;
  }
};

// 获取所有任务
export const getAllTasks = async () => {
  try {
    const response = await api.get('/tasks');
    // 确保返回数组
    return Array.isArray(response.data) ? response.data : (response.data?.tasks || []);
  } catch (error) {
    console.error('获取任务列表失败:', error);
    throw error;
  }
};

// 删除视频
export const deleteVideo = async (id) => {
  try {
    const response = await api.delete(`/videos/${id}`);
    return response.data;
  } catch (error) {
    console.error('删除视频失败:', error);
    throw error;
  }
};

// 修改视频背景
export const changeVideoBackground = async (videoId, backgroundId) => {
  try {
    const response = await api.put(`/videos/${videoId}/background`, { backgroundId });
    return response.data;
  } catch (error) {
    console.error('修改视频背景失败:', error);
    throw error;
  }
};

// 获取所有背景图片
export const getAllBackgrounds = async () => {
  try {
    const response = await api.get('/backgrounds');
    // 确保返回数组
    return Array.isArray(response.data) ? response.data : (response.data?.backgrounds || []);
  } catch (error) {
    console.error('获取背景库失败:', error);
    throw error;
  }
};

// 上传背景到背景库
export const uploadBackgroundToLibrary = async (file, name = '') => {
  try {
    const formData = new FormData();
    formData.append('background', file);
    if (name) {
      formData.append('name', name);
    }
    
    const response = await api.post('/backgrounds', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('上传背景到背景库失败:', error);
    throw error;
  }
};

// 删除背景
export const deleteBackground = async (id) => {
  try {
    const response = await api.delete(`/backgrounds/${id}`);
    return response.data;
  } catch (error) {
    console.error('删除背景失败:', error);
    throw error;
  }
};

export default {
  getFullUrl,
  getAllVideos,
  getVideoById,
  checkVideoExists,
  checkBackgroundExists,
  uploadVideo,
  uploadBackgroundImage,
  deleteVideo,
  startVideoSegmentation,
  createTask,
  getTaskById,
  getTaskStatus,
  getAllTasks,
  changeVideoBackground,
  getAllBackgrounds,
  uploadBackgroundToLibrary,
  deleteBackground
}; 