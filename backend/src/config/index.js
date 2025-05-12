const dotenv = require('dotenv');
const path = require('path');
const logger = require('../utils/logger');

// 根据环境加载不同的.env文件
const envFile = process.env.VIDEO_NODE_ENV === 'production' ? '.env.production' : '.env';
dotenv.config({ path: path.resolve(__dirname, `../../${envFile}`) });

// 基础URL配置
const config = {
  // 服务端口
  PORT: process.env.VIDEO_PORT || 6001,
  
  // API基础URL (用于回调URL等)
  API_BASE_URL: process.env.VIDEO_API_BASE_URL || 'https://to74zigu-nx6sqm6b-6001.zjrestapi.gpufree.cn:8443',
  
  // 前端URL
  FRONTEND_URL: process.env.VIDEO_FRONTEND_URL || 'https://to74zigu-nx6sqm6b-6000.zjrestapi.gpufree.cn:8443',
  
  // 接口服务心跳超时(分钟)
  HEARTBEAT_TIMEOUT: parseInt(process.env.VIDEO_HEARTBEAT_TIMEOUT || '3'),
  
  // 任务调度间隔(毫秒)
  SCHEDULER_INTERVAL: parseInt(process.env.VIDEO_SCHEDULER_INTERVAL || '30000'),
  
  // 认证相关
  JWT_SECRET: process.env.VIDEO_JWT_SECRET || 'your-default-secret-key',
  JWT_EXPIRES_IN: process.env.VIDEO_JWT_EXPIRES_IN || '7d',
  
  // 接口认证字符串
  INTERFACE_IDENTIFICATION: process.env.VIDEO_INTERFACE_IDENTIFICATION || 'wingerboy',
  
  // 上传目录配置
  PHYSICAL_VIDEOS_DIR: process.env.VIDEO_PHYSICAL_VIDEOS_DIR || path.join(__dirname, '../../uploads/videos'),
  PHYSICAL_BACKGROUNDS_DIR: process.env.VIDEO_PHYSICAL_BACKGROUNDS_DIR || path.join(__dirname, '../../uploads/backgrounds'),
  PHYSICAL_OUTPUT_DIR: process.env.VIDEO_PHYSICAL_OUTPUT_DIR || path.join(__dirname, '../../uploads/output'),
  UPLOAD_URL_PATH: process.env.VIDEO_UPLOAD_URL_PATH || 'videos',
  UPLOAD_BACKGROUNDS_URL_PATH: process.env.VIDEO_UPLOAD_BACKGROUNDS_URL_PATH || 'backgrounds',
  DOWNLOAD_OUTPUT_URL_PATH: process.env.VIDEO_DOWNLOAD_OUTPUT_URL_PATH || 'output',
  UPLOAD_FILE_SIZE_LIMIT: parseInt(process.env.VIDEO_UPLOAD_FILE_SIZE_LIMIT || '100'), // 默认100MB
  
  // 数据库配置
  DB_CONFIG: {
    database: process.env.VIDEO_DB_NAME || 'video_segmentation',
    username: process.env.VIDEO_DB_USER || 'root',
    password: process.env.VIDEO_DB_PASSWORD || '',
    host: process.env.VIDEO_DB_HOST || 'localhost',
    port: process.env.VIDEO_DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.VIDEO_NODE_ENV === 'production' ? false : (msg) => logger.debug(msg),
    dialectOptions: {
      // 解决IPv6问题
      host: process.env.VIDEO_DB_HOST || 'localhost',
      // 设置连接超时
      connectTimeout: 60000
    }
  },
  
  // CORS配置
  CORS_ORIGINS: (process.env.VIDEO_CORS_ORIGINS || 'http://localhost:3000,http://localhost:3001')
    .split(',').map(origin => origin.trim())
};

// 打印关键配置（不包含敏感信息）
logger.info('🔧 加载配置：', {
  NODE_ENV: process.env.VIDEO_NODE_ENV || 'development',
  PORT: config.PORT,
  API_BASE_URL: config.API_BASE_URL,
  CORS_ORIGINS: config.CORS_ORIGINS
});

module.exports = config; 