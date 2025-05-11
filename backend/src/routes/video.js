const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const dotenv = require('dotenv');
const { authenticate } = require('../middleware/auth');
const { Video, sequelize } = require('../models');
const { Op } = require('sequelize'); // 直接从sequelize导入Op操作符
const ffmpeg = require('fluent-ffmpeg');
const ffprobe = require('ffprobe-static');
const config = require('../config');
const logger = require('../utils/logger');

// 设置ffprobe路径
ffmpeg.setFfprobePath(ffprobe.path);

// 加载环境变量
dotenv.config();

const router = express.Router();

// 获取配置的上传路径
const UPLOAD_VIDEOS_DIR = config.PHYSICAL_VIDEOS_DIR;
const UPLOAD_URL_PATH = config.UPLOAD_URL_PATH;
const UPLOAD_FILE_SIZE_LIMIT = config.UPLOAD_FILE_SIZE_LIMIT;

logger.info('视频上传配置:', {
  physicalPath: UPLOAD_VIDEOS_DIR,
  urlPath: UPLOAD_URL_PATH,
  fileSizeLimit: `${UPLOAD_FILE_SIZE_LIMIT}MB`
});

// 确保上传目录存在
const ensureDir = (dirPath) => {
  // 判断是否为绝对路径
  const absolutePath = path.isAbsolute(dirPath) 
    ? dirPath // 如果是绝对路径，直接使用
    : path.join(__dirname, '../../', dirPath); // 如果是相对路径，转为绝对路径
  
  logger.debug('上传目录绝对路径:', { path: absolutePath });
  
  if (!fs.existsSync(absolutePath)) {
    fs.mkdirSync(absolutePath, { recursive: true });
    logger.info('创建上传目录:', { path: absolutePath });
  } else {
    logger.debug('上传目录已存在:', { path: absolutePath });
  }
  
  return absolutePath;
};

// 创建上传目录
ensureDir(UPLOAD_VIDEOS_DIR);

// 预检请求的处理
router.options('*', (req, res) => {
  // 根据请求的Origin设置响应头
  const allowedOrigins = config.CORS_ORIGINS;
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  res.sendStatus(200);
});

// Set up multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, ensureDir(UPLOAD_VIDEOS_DIR));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// File filter for multer
const fileFilter = (req, file, cb) => {
  // Allow videos and images
  if (file.mimetype.startsWith('video/') || file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type'), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: UPLOAD_FILE_SIZE_LIMIT * 1024 * 1024 } // 使用配置的文件大小限制
});

// 计算文件的MD5哈希值
const calculateMD5 = (filePath) => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5');
    const stream = fs.createReadStream(filePath);
    
    stream.on('error', err => reject(err));
    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
};

// 获取视频信息（使用ffprobe获取真实数据）
const getVideoInfo = async (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        logger.error('获取视频信息失败:', { error: err.message, filePath });
        // 如果获取失败，返回默认值
        return resolve({
          dimensions: '1920x1080',
          frameCount: 300,
          duration: 0,
          framerate: 30,
          size: 0,
          codec: 'unknown'
        });
      }
      
      try {
        // 从metadata中提取视频流
        const videoStream = metadata.streams.find(s => s.codec_type === 'video');
        const format = metadata.format;
        
        const dimensions = videoStream ? `${videoStream.width}x${videoStream.height}` : '未知';
        const frameRate = videoStream?.r_frame_rate ? 
          eval(videoStream.r_frame_rate).toFixed(2) : // 计算像 "30000/1001" 这样的帧率表达式
          30;
        
        // 估算帧数 = 时长(秒) * 帧率
        const duration = format?.duration || 0;
        const frameCount = Math.round(duration * frameRate) || 300;
        
        const result = {
          dimensions,
          frameCount,
          duration: duration.toFixed(2),
          framerate: frameRate,
          size: (format?.size / (1024 * 1024)).toFixed(2), // MB
          codec: videoStream?.codec_name || 'unknown'
        };
        
        logger.debug('视频信息:', { videoInfo: result, filePath });
        resolve(result);
      } catch (error) {
        logger.error('解析视频信息失败:', { error: error.message, stack: error.stack, filePath });
        resolve({
          dimensions: '1920x1080',
          frameCount: 300,
          duration: 0,
          framerate: 30,
          size: 0,
          codec: 'unknown'
        });
      }
    });
  });
};

// Upload original video
router.post('/upload', authenticate, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No video file uploaded' });
    }
    
    const filePath = req.file.path;
    
    // 使用虚拟路径映射：不存储物理路径，只存储虚拟URL路径
    const fileName = req.file.filename;
    const virtualPath = `${UPLOAD_URL_PATH}/${fileName}`; // 使用虚拟路径格式
    
    logger.debug('文件物理路径:', { filePath, requestId: req.requestId });
    logger.debug('存储的虚拟路径:', { virtualPath, requestId: req.requestId });
    
    // 获取视频名称，如果提供了自定义名称则使用，否则使用原始文件名
    const videoName = req.body.name || req.file.originalname;
    
    // 计算MD5哈希值
    const md5Hash = await calculateMD5(filePath);
    
    // 获取真实的视频信息
    const videoInfo = await getVideoInfo(filePath);
    
    // Create new video entry with enhanced information
    const video = await Video.create({
      email: req.user.email,
      oriVideoName: videoName,
      oriVideoMd5: md5Hash,
      oriVideoPath: filePath, // 存储真实的绝对路径
      oriVideoUrlPath: virtualPath, // 存储虚拟路径，用于URL访问
      oriVideoSize: Math.ceil(req.file.size / (1024 * 1024)), // 转换为MB并向上取整
      oriVideoDim: videoInfo.dimensions,
      oriVideoFrameCnt: videoInfo.frameCount,
      oriVideoDuration: videoInfo.duration, // 新增：视频时长(秒)
      oriVideoFrameRate: videoInfo.framerate, // 新增：视频帧率
      oriVideoCodec: videoInfo.codec, // 新增：视频编码格式
      oriVideoStatus: 'exists',
      oriVideoUsageCnt: 0
    });
    
    res.status(201).json({
      message: 'Video uploaded successfully',
      video: {
        id: video.id,
        oriVideoName: video.oriVideoName,
        oriVideoPath: video.oriVideoPath, // 返回绝对路径
        oriVideoUrlPath: video.oriVideoUrlPath, // 返回URL路径
        oriVideoSize: video.oriVideoSize,
        oriVideoDim: video.oriVideoDim,
        oriVideoFrameCnt: video.oriVideoFrameCnt,
        oriVideoDuration: video.oriVideoDuration,
        oriVideoFrameRate: video.oriVideoFrameRate,
        oriVideoCodec: video.oriVideoCodec
      }
    });
  } catch (error) {
    logger.error('视频上传失败:', { 
      error: error.message, 
      stack: error.stack, 
      user: req.user?.email,
      requestId: req.requestId 
    });
    
    // 如果有文件已上传，尝试删除
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
        logger.info('已删除上传的文件:', { path: req.file.path });
      } catch (unlinkError) {
        logger.error('删除上传文件失败:', { 
          error: unlinkError.message, 
          path: req.file.path,
          requestId: req.requestId 
        });
      }
    }
    
    res.status(500).json({ message: '视频上传失败', error: error.message });
  }
});

// Get all videos for current user
router.get('/user', authenticate, async (req, res) => {
  try {
    const videos = await Video.findByEmail(req.user.email);
    
    res.status(200).json({
      videos: videos.map(video => ({
        id: video.id,
        oriVideoMd5: video.oriVideoMd5,
        oriVideoPath: video.oriVideoPath, // 返回绝对路径
        oriVideoUrlPath: video.oriVideoUrlPath, // 返回URL路径
        oriVideoSize: video.oriVideoSize,
        oriVideoDim: video.oriVideoDim,
        oriVideoFrameCnt: video.oriVideoFrameCnt,
        oriVideoDuration: video.oriVideoDuration, // 新增：视频时长
        oriVideoFrameRate: video.oriVideoFrameRate, // 新增：帧率
        oriVideoCodec: video.oriVideoCodec, // 新增：编码格式
        foreVideoPath: video.foreVideoPath,
        foreVideoMd5: video.foreVideoMd5,
        oriVideoStatus: video.oriVideoStatus,
        foreVideoStatus: video.foreVideoStatus,
        oriVideoUsageCnt: video.oriVideoUsageCnt,
        oriVideoName: video.oriVideoName,
        createdAt: video.createdAt,
        updatedAt: video.updatedAt
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get videos', error: error.message });
  }
});

// Get video by ID
router.get('/user/:id', authenticate, async (req, res) => {
  try {
    // 检查Op操作符是否正确引入
    if (!Op) {
      logger.error('Sequelize Op operators are not properly imported');
      return res.status(500).json({ 
        message: 'Failed to get video', 
        error: 'Database configuration error' 
      });
    }

    // 使用导入的Op对象
    const video = await Video.findOne({ 
      where: { 
        id: req.params.id, 
        email: req.user.email,
        oriVideoStatus: { 
          [Op.ne]: 'deleted' 
        }
      }
    });
    
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    res.status(200).json({
      video: {
        id: video.id,
        orilVideoMd5: video.orilVideoMd5,
        oriVideoPath: video.oriVideoPath, // 返回绝对路径
        oriVideoUrlPath: video.oriVideoUrlPath, // 返回URL路径
        oriVideoSize: video.oriVideoSize,
        oriVideoDim: video.oriVideoDim,
        oriVideoFrameCnt: video.oriVideoFrameCnt,
        foreVideoPath: video.foreVideoPath,
        foreVideoMd5: video.foreVideoMd5,
        oriVideoStatus: video.oriVideoStatus,
        foreVideoStatus: video.foreVideoStatus,
        oriVideoUsageCnt: video.oriVideoUsageCnt,
        oriVideoName: video.oriVideoName,
        createdAt: video.createdAt,
        updatedAt: video.updatedAt
      }
    });
  } catch (error) {
    logger.error('Get video error:', { 
      error: error.message, 
      stack: error.stack,
      user: req.user?.email,
      requestId: req.requestId
    });
    res.status(500).json({ message: 'Failed to get video', error: error.message });
  }
});

// Delete video
router.delete('/del/:id', authenticate, async (req, res) => {
  try {
    // 检查Op操作符是否正确引入
    if (!Op) {
      logger.error('Sequelize Op operators are not properly imported');
      return res.status(500).json({ 
        message: 'Failed to delete video', 
        error: 'Database configuration error' 
      });
    }

    const video = await Video.findOne({ 
      where: { 
        id: req.params.id, 
        email: req.user.email,
        oriVideoStatus: { 
          [Op.ne]: 'deleted' 
        }
      }
    });
    
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    // 更新视频状态为已删除（软删除）
    video.oriVideoStatus = 'deleted';
    if (video.foreVideoStatus === 'exists') {
      video.foreVideoStatus = 'deleted';
    }
    await video.save();
    
    res.status(200).json({ message: 'Video deleted successfully' });
  } catch (error) {
    logger.error('Delete video error:', { 
      error: error.message, 
      stack: error.stack,
      videoId: req.params.id,
      user: req.user?.email,
      requestId: req.requestId 
    });
    res.status(500).json({ message: 'Failed to delete video', error: error.message });
  }
});

// Video segmentation endpoint
router.post('/segment/:id', authenticate, async (req, res) => {
  try {
    const videoId = req.params.id;
    const { modelName } = req.body;
    
    const video = await Video.findOne({ 
      where: { 
        id: videoId, 
        email: req.user.email 
      }
    });
    
    if (!video) {
      return res.status(404).json({ message: '视频不存在' });
    }
    
    if (!video.oriVideoPath) {
      return res.status(400).json({ message: '原始视频不存在' });
    }
    
    // 模拟分割处理
    setTimeout(() => {
      // 在实际应用中，这里应该调用分割服务
      video.oriVideoStatus = 'processing';
      video.save();
      
      // 模拟处理延迟
      setTimeout(async () => {
        // 使用原始视频作为前景视频(实际应用中应该是分割后的视频)
        video.foreVideoPath = video.oriVideoPath;
        video.foreVideoMd5 = video.oriVideoMd5;
        video.foreVideoStatus = 'exists';
        video.oriVideoStatus = 'exists';
        await video.save();
      }, 5000);
    }, 1000);
    
    // 返回预览URL (此处使用原始视频URL作为预览)
    res.json({
      message: '视频分割开始处理',
      videoId: video.id,
      status: 'processing',
      previewUrl: video.oriVideoUrlPath,
      oriVideoPath: video.oriVideoPath // 返回绝对路径，可能用于后续处理
    });
  } catch (error) {
    logger.error('视频分割失败:', {
      error: error.message,
      stack: error.stack,
      user: req.user?.email,
      requestId: req.requestId
    });
    res.status(500).json({ message: '视频分割失败', error: error.message });
  }
});

// 检查视频是否已存在（通过MD5哈希）
router.get('/check/:md5Hash', authenticate, async (req, res) => {
  try {
    const md5Hash = req.params.md5Hash;
    
    // 在数据库中查找相同MD5的视频
    const existingVideo = await Video.findByEmailAndMd5(
      req.user.email,
      md5Hash
    );
    
    if (existingVideo) {
      return res.status(200).json({
        exists: true,
        video: {
          id: existingVideo.id,
          oriVideoPath: existingVideo.oriVideoPath, // 返回绝对路径
          oriVideoUrlPath: existingVideo.oriVideoUrlPath, // 返回URL路径
          oriVideoSize: existingVideo.oriVideoSize,
          oriVideoDim: existingVideo.oriVideoDim,
          oriVideoStatus: existingVideo.oriVideoStatus
        }
      });
    }
    
    // 未找到相同MD5的视频
    res.status(404).json({ exists: false });
  } catch (error) {
    logger.error('检查视频失败:', { 
      error: error.message, 
      stack: error.stack,
      videoId: req.params.id,
      user: req.user?.email,
      requestId: req.requestId
    });
    res.status(500).json({ message: '检查视频失败', error: error.message });
  }
});

module.exports = router; 