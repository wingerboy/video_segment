const dotenv = require('dotenv');
const path = require('path');

// 根据环境加载不同的.env文件
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
dotenv.config({ path: path.resolve(__dirname, `../../${envFile}`) });

// 基础URL配置
const config = {
  // 服务端口
  PORT: process.env.PORT || 6001,
  
  // API基础URL (用于回调URL等)
  API_BASE_URL: process.env.API_BASE_URL || 'https://to74zigu-nx6sqm6b-6001.zjrestapi.gpufree.cn:8443',
  
  // 前端URL
  FRONTEND_URL: process.env.FRONTEND_URL || 'https://to74zigu-nx6sqm6b-6000.zjrestapi.gpufree.cn:8443',
  
  // 接口服务心跳超时(分钟)
  HEARTBEAT_TIMEOUT: parseInt(process.env.HEARTBEAT_TIMEOUT || '3'),
  
  // 任务调度间隔(毫秒)
  SCHEDULER_INTERVAL: parseInt(process.env.SCHEDULER_INTERVAL || '30000'),
  
  // 认证相关
  JWT_SECRET: process.env.JWT_SECRET || 'your-default-secret-key',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  
  // 接口认证字符串
  INTERFACE_IDENTIFICATION: process.env.INTERFACE_IDENTIFICATION || 'wingerboy',
  
  // 上传目录配置
  PHYSICAL_VIDEOS_DIR: process.env.PHYSICAL_VIDEOS_DIR || path.join(__dirname, '../../uploads/videos'),
  PHYSICAL_BACKGROUNDS_DIR: process.env.PHYSICAL_BACKGROUNDS_DIR || path.join(__dirname, '../../uploads/backgrounds'),
  UPLOAD_URL_PATH: process.env.UPLOAD_URL_PATH || 'videos',
  UPLOAD_BACKGROUNDS_URL_PATH: process.env.UPLOAD_BACKGROUNDS_URL_PATH || 'backgrounds',
  UPLOAD_FILE_SIZE_LIMIT: parseInt(process.env.UPLOAD_FILE_SIZE_LIMIT || '100'), // 默认100MB
  
  // 数据库配置
  DB_CONFIG: {
    database: process.env.DB_NAME || 'video_segmentation',
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'production' ? false : console.log
  },
  
  // CORS配置
  CORS_ORIGINS: (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3001')
    .split(',').map(origin => origin.trim())
};

// 打印关键配置（不包含敏感信息）
console.log('🔧 加载配置：', {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: config.PORT,
  API_BASE_URL: config.API_BASE_URL,
  CORS_ORIGINS: config.CORS_ORIGINS
});

module.exports = config; 