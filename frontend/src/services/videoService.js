import axios from 'axios';
import { API_BASE_URL, API_URL, AUTH_CONFIG } from '../config';
import SparkMD5 from 'spark-md5';

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
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * 获取完整的资源URL
 * @param {string} path 资源路径
 * @returns {string} 完整的URL地址
 */
export const getFullUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  
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
    if (cleanPath.includes('/videos/output/') || cleanPath.includes('/output/')) {
      cleanPath = `/output/${filename}`;
    } else if (cleanPath.includes('/videos/') || cleanPath.includes('/originvideo/')) {
      cleanPath = `/videos/${filename}`;
    } else if (cleanPath.includes('/backgrounds/') || cleanPath.includes('/background/')) {
      cleanPath = `/backgrounds/${filename}`;
    } else if (cleanPath.includes('/masks/')) {
      cleanPath = `/masks/${filename}`;
    } else if (cleanPath.includes('/results/')) {
      cleanPath = `/results/${filename}`;
    } else {
      // 如果无法确定资源类型，就使用默认的videos路径
      cleanPath = `/videos/${filename}`;
    }
  }
  
  // 确保路径以/开头
  if (!cleanPath.startsWith('/')) {
    cleanPath = '/' + cleanPath;
  }
  
  console.log('原始路径:', path);
  console.log('处理后路径:', cleanPath);
  console.log('完整URL:', `${API_BASE_URL}${cleanPath}`);
  
  // 返回完整URL
  return `${API_BASE_URL}${cleanPath}`;
};

// 获取所有视频
export const getAllVideos = async () => {
  try {
    const response = await api.get('/videos/user');
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
    const response = await api.get(`/videos/user/${id}`);
    return response.data;
  } catch (error) {
    console.error('获取视频详情失败:', error);
    throw error;
  }
};

// 计算文件MD5（分片，避免一次性加载超大文件导致内存溢出）
export const calculateMD5 = async (file, progressCallback = null) => {
  return new Promise((resolve, reject) => {
    const chunkSize = 2 * 1024 * 1024; // 2MB
    const chunks = Math.ceil(file.size / chunkSize);
    let currentChunk = 0;
    const spark = new SparkMD5.ArrayBuffer();
    const reader = new FileReader();

    reader.onload = function (e) {
      spark.append(e.target.result);
      currentChunk++;
      if (progressCallback) {
        progressCallback(Math.round((currentChunk / chunks) * 100));
      }
      if (currentChunk < chunks) {
        loadNext();
      } else {
        resolve(spark.end());
      }
    };

    reader.onerror = function (e) {
      reject(e);
    };

    function loadNext() {
      const start = currentChunk * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      reader.readAsArrayBuffer(file.slice(start, end));
    }

    loadNext();
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

    // 如果前端需要构建完整的视频URL
    if (response.data.video && response.data.video.oriVideoPath) {
      console.log('视频上传成功，路径:', response.data.video.oriVideoPath);
    }

    return response.data;
  } catch (error) {
    console.error('上传视频失败:', error);
    throw error;
  }
};

// 删除视频
export const deleteVideo = async (id) => {
  try {
    const response = await api.delete(`/videos/del/${id}`);
    return response.data;
  } catch (error) {
    console.error('删除视频失败:', error);
    throw error;
  }
};

// 修改视频背景
export const changeVideoBackground = async (videoId, backgroundId) => {
  try {
    return { success: false, message: 'This function is deprecated' };
  } catch (error) {
    console.error('修改视频背景失败:', error);
    throw error;
  }
};

export default {
  getFullUrl,
  getAllVideos,
  getVideoById,
  checkVideoExists,
  uploadVideo,
  deleteVideo,
  changeVideoBackground
};
