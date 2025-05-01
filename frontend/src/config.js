/**
 * 前端应用统一配置文件
 * 这里集中管理所有的应用配置，避免硬编码散落在各处
 */

// API配置
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:6001';
// 从环境变量获取API URL，默认为localhost:5001
export const API_URL = process.env.REACT_APP_API_URL || `${API_BASE_URL}/api`;

// 上传文件配置
export const UPLOAD_CONFIG = {
  MAX_VIDEO_SIZE: parseInt(process.env.REACT_APP_MAX_VIDEO_SIZE || '2000') * 1024 * 1024, // 2000MB
  MAX_BACKGROUND_SIZE: parseInt(process.env.REACT_APP_MAX_BACKGROUND_SIZE || '10') * 1024 * 1024, // 10MB
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'],
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'],
  VIDEO_FORMAT_SUPPORT_TEXT: 'MP4, WebM, MOV等视频格式',
  IMAGE_FORMAT_SUPPORT_TEXT: 'JPEG, PNG, GIF, SVG, WebP等图片格式'
};

// 分页配置
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 20, 50]
};

// 认证配置
export const AUTH_CONFIG = {
  TOKEN_KEY: 'auth_token',
  USER_INFO_KEY: 'user_info',
  DEFAULT_AVATAR: '/default-avatar.png'
};

// 界面配置
export const UI_CONFIG = {
  THEME_COLOR_PRIMARY: '#1976d2',
  THEME_COLOR_SECONDARY: '#dc004e',
  SNACKBAR_AUTO_HIDE_DURATION: 5000, // 消息提示自动隐藏时间(毫秒)
  DEFAULT_ANIMATION_DURATION: 300,
  LOGO_PATH: '/logo.svg'
};

// 其他配置
export const APP_CONFIG = {
  APP_NAME: '视频分割与合成平台',
  COPYRIGHT_TEXT: `© ${new Date().getFullYear()} 视频分割与合成平台. 保留所有权利.`,
  CONTACT_EMAIL: 'support@example.com',
  VERSION: '1.0.0'
};

// 开发配置
export const DEV_CONFIG = {
  DEBUG_MODE: process.env.NODE_ENV !== 'production',
  LOG_API_CALLS: process.env.NODE_ENV !== 'production'
};

// 导出所有配置
export default {
  API_BASE_URL,
  API_URL,
  UPLOAD_CONFIG,
  PAGINATION_CONFIG,
  AUTH_CONFIG,
  UI_CONFIG,
  APP_CONFIG,
  DEV_CONFIG
};