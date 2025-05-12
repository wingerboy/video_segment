const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const videoRoutes = require('./routes/video');
const backgroundRoutes = require('./routes/backgrounds');
const taskRoutes = require('./routes/tasks');
const accountRoutes = require('./routes/account');
const adminRoutes = require('./routes/admin');
const path = require('path');
const taskScheduler = require('./services/taskScheduler');
const config = require('./config');
const fs = require('fs');
const logger = require('./utils/logger');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

// 记录应用启动信息
logger.info('应用启动中...', {
  environment: process.env.NODE_ENV || 'development',
  nodeVersion: process.version,
  platform: process.platform,
  memory: process.memoryUsage()
});

// Import database models (will automatically connect and sync the database)
require('./models');

const app = express();
const PORT = config.PORT;

// CORS配置
const corsOptions = {
  origin: function(origin, callback) {
    // 使用配置中的CORS_ORIGINS
    if (!origin || config.CORS_ORIGINS.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.warn('CORS请求被拒绝', { origin });
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));

// 在CORS之后添加预处理中间件，确保OPTIONS请求正确处理
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  next();
});

// 请求日志中间件（在所有路由之前）
app.use(requestLogger);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 配置静态文件服务，使用配置中的目录
const PHYSICAL_VIDEOS_DIR = config.PHYSICAL_VIDEOS_DIR;
const VIRTUAL_VIDEOS_PATH = config.UPLOAD_URL_PATH;

// 背景图片的静态文件服务配置
const PHYSICAL_BACKGROUNDS_DIR = config.PHYSICAL_BACKGROUNDS_DIR;
const VIRTUAL_BACKGROUNDS_PATH = config.UPLOAD_BACKGROUNDS_URL_PATH;

// 定义输出视频的物理路径和虚拟路径
const PHYSICAL_OUTPUT_DIR = config.PHYSICAL_OUTPUT_DIR;
const VIRTUAL_OUTPUT_PATH = config.DOWNLOAD_OUTPUT_URL_PATH;

// 确保上传目录存在
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    logger.info(`创建目录: ${dirPath}`);
  }
};

// 创建必要的目录
ensureDir(PHYSICAL_VIDEOS_DIR);
ensureDir(PHYSICAL_BACKGROUNDS_DIR);

// 创建输出目录
ensureDir(PHYSICAL_OUTPUT_DIR);

// 配置静态文件服务
app.use(`/${VIRTUAL_VIDEOS_PATH}`, express.static(PHYSICAL_VIDEOS_DIR));
app.use(`/${VIRTUAL_BACKGROUNDS_PATH}`, express.static(PHYSICAL_BACKGROUNDS_DIR));
app.use(`/${VIRTUAL_OUTPUT_PATH}`, express.static(PHYSICAL_OUTPUT_DIR));

logger.info('静态文件服务配置完成', {
  videoMapping: `/${VIRTUAL_VIDEOS_PATH} => ${PHYSICAL_VIDEOS_DIR}`,
  backgroundMapping: `/${VIRTUAL_BACKGROUNDS_PATH} => ${PHYSICAL_BACKGROUNDS_DIR}`,
  outputMapping: `/${VIRTUAL_OUTPUT_PATH} => ${PHYSICAL_OUTPUT_DIR}`
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/backgrounds', backgroundRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/admin', adminRoutes);

// Default route
app.get('/', (req, res) => {
  res.send('Video Segmentation API is running');
});

// 全局错误处理中间件（在所有路由之后）
app.use(errorHandler);

// Start server
app.listen(PORT, async () => {
  logger.info(`服务器已启动`, {
    port: PORT,
    baseUrl: config.API_BASE_URL,
    environment: process.env.NODE_ENV || 'development',
    startTime: new Date().toISOString()
  });
  
  // 启动任务调度器
  try {
    await taskScheduler.start();
    logger.info('任务调度器已启动');
  } catch (error) {
    logger.error('启动任务调度器失败:', { error: error.message, stack: error.stack });
  }
});

// 处理进程退出
process.on('SIGINT', async () => {
  logger.info('服务器关闭中...');
  
  try {
    // 停止任务调度器
    await taskScheduler.stop();
    logger.info('任务调度器已停止');
  } catch (error) {
    logger.error('停止任务调度器失败:', { error: error.message, stack: error.stack });
  }
  
  // 给日志一点时间完成写入
  setTimeout(() => {
    logger.info('服务器已关闭', { shutdownTime: new Date().toISOString() });
    process.exit(0);
  }, 1000);
}); 