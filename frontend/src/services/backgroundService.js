import axios from 'axios';
import { API_BASE_URL, API_URL, AUTH_CONFIG } from '../config';
import crypto from 'crypto-js';

// 创建axios实例
const api = axios.create({
  baseURL: API_URL
});

// 请求拦截器，添加认证token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * 获取完整的URL路径
 * @param {string} path 资源路径
 * @returns {string} 完整URL
 */
export const getFullUrl = (path) => {
  if (!path) {
    console.log('警告: 路径为空');
    return '';
  }
  
  if (path.startsWith('http')) {
    console.log('路径已是完整URL:', path);
    return path;
  }
  
  // 确定使用哪种路径类型
  let cleanPath = path;
  
  // 检查是否包含特定的系统路径模式
  if (cleanPath.includes('/root/gpufree-share/videos/') || 
      cleanPath.includes('/root/gpufree-data/') ||
      cleanPath.includes('/Users/') || 
      cleanPath.includes('/home/')) {
    
    // 获取文件名
    const filename = cleanPath.split('/').pop();
    
    // 检查路径中包含的目录类型
    if (cleanPath.includes('/background/')) {
      cleanPath = `/backgrounds/${filename}`;
    } else if (cleanPath.includes('/backgrounds/')) {
      cleanPath = `/backgrounds/${filename}`;
    } else if (cleanPath.includes('/videos/') || cleanPath.includes('/originvideo/')) {
      cleanPath = `/videos/${filename}`;
    } else if (cleanPath.includes('/masks/')) {
      cleanPath = `/masks/${filename}`;
    } else if (cleanPath.includes('/results/')) {
      cleanPath = `/results/${filename}`;
    } else {
      // 如果无法确定资源类型，就使用默认的backgrounds路径
      cleanPath = `/backgrounds/${filename}`;
    }
  }
  
  // 确保路径以/开头
  if (!cleanPath.startsWith('/')) {
    cleanPath = '/' + cleanPath;
  }
  
  console.log('背景图片路径处理:');
  console.log(`- 原始路径: ${path}`);
  console.log(`- 处理后路径: ${cleanPath}`);
  
  const fullUrl = `${API_BASE_URL}${cleanPath}`;
  console.log(`- 完整URL: ${fullUrl}`);
  
  // 返回完整URL
  return fullUrl;
};

/**
 * 获取用户所有背景图片
 * @returns {Promise<Array>} 背景列表
 */
export const getAllBackgrounds = async () => {
  try {
    const response = await api.get('/backgrounds/user');
    return response.data || [];
  } catch (error) {
    console.error('获取背景列表失败:', error);
    throw error;
  }
};

/**
 * 获取用户所有背景图片（兼容API）
 * @returns {Promise<Array>} 背景列表
 */
export const getUserBackgrounds = async () => {
  return getAllBackgrounds();
};

/**
 * 获取单个背景详情
 * @param {string|number} backgroundId 背景ID
 * @returns {Promise<Object>} 背景详情
 */
export const getBackgroundById = async (backgroundId) => {
  try {
    const response = await api.get(`/backgrounds/user/${backgroundId}`);
    return response.data;
  } catch (error) {
    console.error(`获取背景 #${backgroundId} 详情失败:`, error);
    throw error;
  }
};

/**
 * 获取单个背景详情（兼容API）
 * @param {string|number} backgroundId 背景ID
 * @returns {Promise<Object>} 背景详情
 */
export const getBackgroundDetails = async (backgroundId) => {
  return getBackgroundById(backgroundId);
};

/**
 * 计算文件的MD5哈希值
 * @param {File} file 文件对象
 * @returns {Promise<string>} MD5哈希值
 */
export const calculateMD5 = async (file) => {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const binary = e.target.result;
          const md5Hash = crypto.MD5(binary).toString();
          resolve(md5Hash);
        } catch (hashError) {
          reject(hashError);
        }
      };
      
      reader.onerror = (error) => reject(error);
      
      reader.readAsBinaryString(file);
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * 检查背景图是否已存在
 * @param {string} md5Hash MD5哈希值
 * @returns {Promise<Object>} 检查结果，包含exists和可能的背景对象
 */
export const checkBackgroundExistence = async (md5Hash) => {
  try {
    const response = await api.get(`/backgrounds/check/${md5Hash}`);
    return {
      exists: true,
      background: response.data.background
    };
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return { exists: false };
    }
    console.error('检查背景存在性失败:', error);
    throw error;
  }
};

/**
 * 上传背景图片
 * @param {File} backgroundFile 背景图文件
 * @param {string} backgroundName 背景名称
 * @param {Function} onProgress 上传进度回调
 * @returns {Promise<Object>} 上传结果
 */
export const uploadBackground = async (backgroundFile, backgroundName, onProgress) => {
  try {
    const formData = new FormData();
    formData.append('background', backgroundFile);
    
    if (backgroundName) {
      formData.append('name', backgroundName);
    }
    
    const response = await api.post('/backgrounds/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        if (onProgress) {
          onProgress(percentCompleted);
        }
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('上传背景失败:', error);
    throw error;
  }
};

/**
 * 删除背景
 * @param {string|number} backgroundId 背景ID
 * @returns {Promise<Object>} 删除结果
 */
export const deleteBackground = async (backgroundId) => {
  try {
    const response = await api.delete(`/backgrounds/del/${backgroundId}`);
    return response.data;
  } catch (error) {
    console.error(`删除背景 #${backgroundId} 失败:`, error);
    throw error;
  }
};

/**
 * 更新背景使用次数
 * @param {string|number} backgroundId 背景ID
 * @returns {Promise<Object>} 更新结果
 */
export const incrementBackgroundUsage = async (backgroundId) => {
  try {
    const response = await api.put(`/backgrounds/usage/${backgroundId}`);
    return response.data;
  } catch (error) {
    console.error(`更新背景使用次数 #${backgroundId} 失败:`, error);
    throw error;
  }
};

export default {
  getFullUrl,
  getAllBackgrounds,
  getUserBackgrounds,
  getBackgroundById,
  getBackgroundDetails,
  calculateMD5,
  checkBackgroundExistence,
  uploadBackground,
  deleteBackground,
  incrementBackgroundUsage
}; 