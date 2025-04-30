import axios from 'axios';
import CryptoJS from 'crypto-js';
import { API_BASE_URL, API_URL, API_URL_JAVA } from '../config';

// 创建axios实例
const api = axios.create({
  baseURL: API_URL
});

// 请求拦截器，添加认证token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
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
  
  // 简化路径处理 - 只关注虚拟路径部分
  let cleanPath = path;
  
  // 确保路径以/开头
  if (!cleanPath.startsWith('/')) {
    cleanPath = '/' + cleanPath;
  }
  
  // 处理绝对路径 - 如果包含多级目录路径，只保留关键部分
  const pathParts = cleanPath.split('/');
  // 尝试找到虚拟路径的关键部分（backgrounds/文件名）
  const bgIndex = pathParts.findIndex(part => part === 'backgrounds' || part === 'background');
  
  if (bgIndex !== -1 && pathParts.length > bgIndex + 1) {
    // 如果找到 "backgrounds" 或 "background" 部分，只保留这样的关键部分
    const oldPath = cleanPath;
    cleanPath = '/' + (pathParts[bgIndex] === 'background' ? 'backgrounds' : pathParts[bgIndex]) + '/' + pathParts[bgIndex + 1];
    console.log(`路径标准化: ${oldPath} -> ${cleanPath}`);
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
 * 计算文件MD5哈希值
 * @param {File} file 文件对象
 * @returns {Promise<string>} MD5哈希值
 */
export const calculateMD5 = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const binary = e.target.result;
      const md5 = CryptoJS.MD5(binary).toString();
      resolve(md5);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};

/**
 * 获取用户所有背景图片
 * @returns {Promise<Array>} 背景列表
 */
export const getUserBackgrounds = async () => {
  try {
    const response = await api.get('/backgrounds/user');
    return response.data;
  } catch (error) {
    console.error('获取用户背景出错:', error);
    throw error;
  }
};

/**
 * 上传背景到背景库
 * @param {FormData} formData 包含文件和元数据的FormData对象
 * @returns {Promise<Object>} 上传的背景信息
 */
export const uploadBackground = async (formData) => {
  try {
    const response = await api.post('/backgrounds/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('上传背景出错:', error);
    throw error;
  }
};

/**
 * 检查背景是否已存在（通过MD5哈希）
 * @param {string} md5Hash 文件的MD5哈希值
 * @returns {Promise<Object>} 检查结果
 */
export const checkBackgroundExists = async (md5Hash) => {
  try {
    const response = await api.get(`/backgrounds/check/${md5Hash}`);
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return { exists: false };
    }
    console.error('检查背景是否存在出错:', error);
    throw error;
  }
};

/**
 * 删除背景
 * @param {string} backgroundId 背景ID
 * @returns {Promise<Object>} 操作结果
 */
export const deleteBackground = async (backgroundId) => {
  try {
    const response = await api.delete(`/backgrounds/del/${backgroundId}`);
    return response.data;
  } catch (error) {
    console.error('删除背景出错:', error);
    throw error;
  }
};

/**
 * 增加背景使用次数
 * @param {string} backgroundId 背景ID
 * @returns {Promise<Object>} 更新后的背景使用信息
 */
export const incrementBackgroundUsage = async (backgroundId) => {
  try {
    const response = await api.put(`/backgrounds/usage/${backgroundId}`);
    return response.data;
  } catch (error) {
    console.error('增加背景使用次数出错:', error);
    throw error;
  }
};

/**
 * 获取背景详情
 * @param {string} backgroundId 背景ID
 * @returns {Promise<Object>} 背景详细信息
 */
export const getBackgroundDetails = async (backgroundId) => {
  try {
    // 由于backgrounds.js路由没有专门的获取单个背景的端点
    // 先获取所有背景，然后过滤出指定ID的背景
    const allBackgrounds = await getUserBackgrounds();
    const background = allBackgrounds.find(bg => bg.id === parseInt(backgroundId) || bg.id === backgroundId);
    
    if (!background) {
      throw new Error('背景不存在');
    }
    
    return background;
  } catch (error) {
    console.error('获取背景详情出错:', error);
    throw error;
  }
};

/**
 * 获取背景使用统计
 * @param {string} backgroundId 背景ID
 * @returns {Promise<Array>} 背景使用统计信息
 */
export const getBackgroundUsage = async (backgroundId) => {
  try {
    const response = await api.get(`/backgrounds/usage/${backgroundId}`);
    return response.data;
  } catch (error) {
    console.error('获取背景使用统计出错:', error);
    throw error;
  }
};

/**
 * 更新背景信息
 * @param {string} backgroundId 背景ID
 * @param {Object} updateData 要更新的数据
 * @returns {Promise<Object>} 更新后的背景信息
 */
export const updateBackground = async (backgroundId, updateData) => {
  try {
    const response = await api.put(`/backgrounds/${backgroundId}`, updateData);
    return response.data;
  } catch (error) {
    console.error('更新背景信息出错:', error);
    throw error;
  }
};

export default {
  getFullUrl,
  calculateMD5,
  getUserBackgrounds,
  uploadBackground,
  checkBackgroundExists,
  deleteBackground,
  incrementBackgroundUsage,
  getBackgroundDetails,
  getBackgroundUsage,
  updateBackground
}; 