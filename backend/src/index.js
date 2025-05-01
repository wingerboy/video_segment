const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const videoRoutes = require('./routes/video');
const backgroundRoutes = require('./routes/backgrounds');
const taskRoutes = require('./routes/tasks');
const accountRoutes = require('./routes/account');
const path = require('path');
const taskScheduler = require('./services/taskScheduler');
const config = require('./config');
const fs = require('fs');

// Load environment variables
dotenv.config();

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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 配置静态文件服务，使用配置中的目录
const PHYSICAL_VIDEOS_DIR = config.PHYSICAL_VIDEOS_DIR;
const VIRTUAL_VIDEOS_PATH = config.UPLOAD_URL_PATH;

// 背景图片的静态文件服务配置
const PHYSICAL_BACKGROUNDS_DIR = config.PHYSICAL_BACKGROUNDS_DIR;
const VIRTUAL_BACKGROUNDS_PATH = config.UPLOAD_BACKGROUNDS_URL_PATH;

// 确保上传目录存在
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log('创建目录:', dirPath);
  }
};

// 创建必要的目录
ensureDir(PHYSICAL_VIDEOS_DIR);
ensureDir(PHYSICAL_BACKGROUNDS_DIR);

// 配置静态文件服务
app.use(`/${VIRTUAL_VIDEOS_PATH}`, express.static(PHYSICAL_VIDEOS_DIR));
app.use(`/${VIRTUAL_BACKGROUNDS_PATH}`, express.static(PHYSICAL_BACKGROUNDS_DIR));

console.log('==== 静态文件服务配置 ====');
console.log(`视频虚拟路径 /${VIRTUAL_VIDEOS_PATH} 映射到 ${PHYSICAL_VIDEOS_DIR}`);
console.log(`背景虚拟路径 /${VIRTUAL_BACKGROUNDS_PATH} 映射到 ${PHYSICAL_BACKGROUNDS_DIR}`);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/backgrounds', backgroundRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/account', accountRoutes);

// Default route
app.get('/', (req, res) => {
  res.send('Video Segmentation API is running');
});

// Start server
app.listen(PORT, async () => {
  console.log(`服务器已启动: ${config.API_BASE_URL}`);
  
  // 启动任务调度器
  try {
    await taskScheduler.start();
    console.log('任务调度器已启动');
  } catch (error) {
    console.error('启动任务调度器失败:', error);
  }
});

// 处理进程退出
process.on('SIGINT', async () => {
  console.log('服务器关闭中...');
  
  try {
    // 停止任务调度器
    await taskScheduler.stop();
    console.log('任务调度器已停止');
  } catch (error) {
    console.error('停止任务调度器失败:', error);
  }
  
  process.exit(0);
}); 