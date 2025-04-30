const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const videoRoutes = require('./routes/video');
const backgroundRoutes = require('./routes/backgrounds');
const taskRoutes = require('./routes/tasks');
const accountRoutes = require('./routes/account');
const path = require('path');

// Load environment variables
dotenv.config();

// Import database models (will automatically connect and sync the database)
require('./models');

const app = express();
const PORT = process.env.PORT || 5001;

// CORS配置
const corsOptions = {
  origin: function(origin, callback) {
    const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001'];
    // 允许没有origin的请求（比如移动应用或curl等工具发起的请求）
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
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

// 配置静态文件服务，使用环境变量配置物理上传目录
const PHYSICAL_VIDEOS_DIR = process.env.PHYSICAL_VIDEOS_DIR || path.join(__dirname, '../uploads/videos');
const VIRTUAL_VIDEOS_PATH = process.env.UPLOAD_URL_PATH || 'videos';

// 背景图片的静态文件服务配置
const PHYSICAL_BACKGROUNDS_DIR = process.env.PHYSICAL_BACKGROUNDS_DIR || path.join(__dirname, '../uploads/backgrounds');
const VIRTUAL_BACKGROUNDS_PATH = process.env.UPLOAD_BACKGROUNDS_URL_PATH || 'backgrounds';

// 旧的可能存在数据的路径（为了兼容性）
const OLD_VIDEOS_DIR = path.join(__dirname, '../uploads/videos');
const OLD_BACKGROUNDS_DIR = path.join(__dirname, '../uploads/background');
const FULL_VIDEOS_DIR = '/Users/wingerliu/Downloads/windsurf/video_segment/uploads/videos';
const FULL_BACKGROUNDS_DIR = '/Users/wingerliu/Downloads/windsurf/video_segment/uploads/background';

// 配置静态文件服务，将虚拟路径映射到多个物理目录（按优先级顺序）
// 这样可以同时支持多个存储位置
app.use(`/${VIRTUAL_VIDEOS_PATH}`, [
  express.static(PHYSICAL_VIDEOS_DIR),  // 新配置的路径（首选）
  express.static(FULL_VIDEOS_DIR)       // 老的绝对路径（备选）
]);

app.use(`/${VIRTUAL_BACKGROUNDS_PATH}`, [
  express.static(PHYSICAL_BACKGROUNDS_DIR),  // 新配置的路径（首选）
  express.static(FULL_BACKGROUNDS_DIR)       // 老的绝对路径（备选）
]);

console.log('==== 静态文件服务多路径配置 ====');
console.log(`视频虚拟路径 /${VIRTUAL_VIDEOS_PATH} 映射到:`);
console.log(`- 主路径: ${PHYSICAL_VIDEOS_DIR}`);
console.log(`\n背景虚拟路径 /${VIRTUAL_BACKGROUNDS_PATH} 映射到:`);
console.log(`- 主路径: ${PHYSICAL_BACKGROUNDS_DIR}`);

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
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 