const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const dotenv = require('dotenv');
const { authenticate } = require('../middleware/auth');
const { Video, sequelize } = require('../models');
const { extractVideoQueue, applyBackgroundQueue } = require('../services/queue');
const { Op } = require('sequelize')


// 加载环境变量
dotenv.config();

const router = express.Router();

// 获取配置的上传路径
const UPLOAD_BASE_DIR = process.env.UPLOAD_BASE_DIR || 'uploads';
const UPLOAD_VIDEOS_DIR = process.env.UPLOAD_VIDEOS_DIR || 'uploads/videos';
const UPLOAD_FILE_SIZE_LIMIT = parseInt(process.env.UPLOAD_FILE_SIZE_LIMIT || '100'); // 默认100MB

// 确保上传目录存在
const ensureDir = (dirPath) => {
  const absolutePath = path.join(__dirname, '../../', dirPath);
  if (!fs.existsSync(absolutePath)) {
    fs.mkdirSync(absolutePath, { recursive: true });
  }
  return absolutePath;
};

// 创建上传目录
ensureDir(UPLOAD_BASE_DIR);
ensureDir(UPLOAD_VIDEOS_DIR);

// 预检请求的处理
router.options('*', (req, res) => {
  // 根据请求的Origin设置响应头
  const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001'];
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

// 获取视频信息（此处简化处理，实际应使用ffprobe等工具）
const getVideoInfo = async (filePath) => {
  // 在实际应用中应使用如ffprobe等工具获取视频信息
  return {
    dimensions: '1920x1080',  // 默认尺寸
    frameCount: 300           // 默认帧数
  };
};

// Upload original video
router.post('/upload', authenticate, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No video file uploaded' });
    }
    
    const filePath = req.file.path;
    const relativePath = path.relative(path.join(__dirname, '../../'), filePath).replace(/\\/g, '/');
    
    // 获取视频名称，如果提供了自定义名称则使用，否则使用原始文件名
    const videoName = req.body.name || req.file.originalname;
    
    // 计算MD5哈希值
    const md5Hash = await calculateMD5(filePath);
    // 获取视频信息
    const videoInfo = await getVideoInfo(filePath);

    // 检查数据库中是否已存在相同的 md5Hash
    const existingVideo = await Video.findOne({
      where: {
        md5Hash: md5Hash,
        status: { [Op.notIn]: ['deleted', 'expired'] } // 可选：排除已删除/过期的视频
      }
    });
    
    if (existingVideo) {
      // 删除刚上传的文件（避免存储重复文件）
      fs.unlinkSync(filePath); 
      return res.status(409).json({ 
        message: '视频库内已存在相同的视频',
        existingVideoId: existingVideo.id // 可选：返回已存在的视频ID
      });
    }
    
    // Create new video entry
    const video = await Video.create({
      userId: req.user.id,
      name: videoName, // 保存视频名称
      md5Hash: md5Hash,
      originalVideo: relativePath,
      size: req.file.size,
      dimensions: videoInfo.dimensions,
      frameCount: videoInfo.frameCount,
      status: 'active',
      usageCount: 0
    });
    
    // Add to extract video queue
    extractVideoQueue.add({
      videoId: video.id
    },{
      removeOnComplete: true,
      removeOnFail: true
    }).catch(error => {
      console.error('Failed to add job to queue:', error);
    });
    res.status(201).json({
      message: 'Video uploaded successfully',
      video: {
        id: video.id,
        name: video.name, // 返回保存的名称
        originalVideo: video.originalVideo,
        md5Hash: video.md5Hash,
        size: video.size,
        dimensions: video.dimensions,
        status: video.status
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Video upload failed', error: error.message });
  }
});

// Upload background image
router.post('/background/:id', authenticate, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded' });
    }
    
    const video = await Video.findOne({ 
      where: { 
        id: req.params.id, 
        userId: req.user.id,
        status: { 
          [Op.notIn]: ['deleted', 'expired'] 
        }
      }
    });
    
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    const filePath = req.file.path;
    const relativePath = path.relative(path.join(__dirname, '../../'), filePath).replace(/\\/g, '/');
    
    // Save background image path
    video.backgroundImage = relativePath;
    video.usageCount += 1;
    await video.save();
    
    // If extracted foreground exists, queue apply background job
    if (video.extractedForeground) {
      await applyBackgroundQueue.add({
        videoId: video.id
      });
    }
    
    res.status(200).json({
      message: 'Background image uploaded successfully',
      video: {
        id: video.id,
        backgroundImage: video.backgroundImage,
        status: video.status
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Background upload failed', error: error.message });
  }
});

// Get all videos for current user
router.get('/', authenticate, async (req, res) => {
  try {
    const videos = await Video.findAll({ 
      where: { 
        userId: req.user.id,
        status: { 
          [Op.notIn]: ['deleted', 'expired'] 
        }
      },
      order: [['createdAt', 'DESC']]
    });
    
    res.status(200).json({
      videos: videos.map(video => ({
        id: video.id,
        md5Hash: video.md5Hash,
        originalVideo: video.originalVideo,
        size: video.size,
        dimensions: video.dimensions,
        frameCount: video.frameCount,
        extractedForeground: video.extractedForeground,
        backgroundImage: video.backgroundImage,
        finalVideo: video.finalVideo,
        status: video.status,
        usageCount: video.usageCount,
        createdAt: video.createdAt,
        updatedAt: video.updatedAt
      }))
    });
  } catch (error) {
    console.error(Op);
    res.status(500).json({ message: 'Failed to get videos', error: error.message });
  }
});

// Get video by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const video = await Video.findOne({ 
      where: { 
        id: req.params.id, 
        userId: req.user.id,
        status: { 
          [Op.notIn]: ['deleted', 'expired'] 
        }
      }
    });
    
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    res.status(200).json({
      video: {
        id: video.id,
        md5Hash: video.md5Hash,
        originalVideo: video.originalVideo,
        size: video.size,
        dimensions: video.dimensions,
        frameCount: video.frameCount,
        extractedForeground: video.extractedForeground,
        backgroundImage: video.backgroundImage,
        finalVideo: video.finalVideo,
        status: video.status,
        usageCount: video.usageCount,
        createdAt: video.createdAt,
        updatedAt: video.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get video', error: error.message });
  }
});

// Delete video
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const video = await Video.findOne({ 
      where: { 
        id: req.params.id, 
        userId: req.user.id,
        status: { 
          [Op.notIn]: ['deleted', 'expired'] 
        }
      }
    });
    
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    // 更新视频状态为已删除（软删除）
    video.status = 'deleted';
    await video.save();
    
    // 如果需要物理删除文件
    // const filesToDelete = [
    //   video.originalVideo, 
    //   video.extractedForeground, 
    //   video.backgroundImage, 
    //   video.finalVideo
    // ].filter(Boolean);
    // 
    // filesToDelete.forEach(filePath => {
    //   const fullPath = path.join(__dirname, '../../', filePath);
    //   if (fs.existsSync(fullPath)) {
    //     fs.unlinkSync(fullPath);
    //   }
    // });
    
    res.status(200).json({ message: 'Video deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete video', error: error.message });
  }
});

// Video segmentation endpoint
router.post('/:id/segment', authenticate, async (req, res) => {
  try {
    const videoId = req.params.id;
    const { modelId } = req.body;
    
    const video = await Video.findOne({ 
      where: { 
        id: videoId, 
        userId: req.user.id 
      }
    });
    
    if (!video) {
      return res.status(404).json({ message: '视频不存在' });
    }
    
    if (!video.originalVideo) {
      return res.status(400).json({ message: '原始视频不存在' });
    }
    
    // 模拟分割处理
    setTimeout(() => {
      // 在实际应用中，这里应该调用分割服务
      video.status = 'processing';
      video.save();
      
      // 模拟处理延迟
      setTimeout(async () => {
        // 使用原始视频作为前景视频(实际应用中应该是分割后的视频)
        video.extractedForeground = video.originalVideo;
        video.status = 'completed';
        await video.save();
      }, 5000);
    }, 1000);
    
    // 返回预览URL (此处使用原始视频URL作为预览)
    res.json({
      message: '视频分割开始处理',
      videoId: video.id,
      status: 'processing',
      previewUrl: video.originalVideo
    });
  } catch (error) {
    console.error('视频分割失败:', error);
    res.status(500).json({ message: '视频分割失败', error: error.message });
  }
});

// Apply background to video
router.put('/:id/background', authenticate, async (req, res) => {
  try {
    const videoId = req.params.id;
    const { backgroundId } = req.body;
    console.log(backgroundId, '背景图片id');
    const video = await Video.findOne({ 
      where: { 
        id: videoId, 
        userId: req.user.id 
      }
    });
    
    if (!video) {
      return res.status(404).json({ message: '视频不存在' });
    }
    
    if (!video.extractedForeground) {
      return res.status(400).json({ message: '视频前景尚未提取' });
    }
    
    // 在实际应用中，这里应该根据backgroundId获取背景图片
    // 并将其应用到视频上。这里我们简单模拟这个过程。
    
    // 模拟背景应用过程
    video.status = 'processing';
    await video.save();
    
    setTimeout(async () => {
      // 使用原始视频作为最终视频 (实际应用中应该是合成后的视频)
      video.finalVideo = video.originalVideo;
      video.status = 'completed';
      await video.save();
    }, 5000);
    
    res.json({
      message: '背景应用处理开始',
      videoId: video.id,
      status: 'processing'
    });
  } catch (error) {
    console.error('应用背景失败:', error);
    res.status(500).json({ message: '应用背景失败', error: error.message });
  }
});

// 检查视频是否已存在（通过MD5哈希）
router.get('/check/:md5Hash', authenticate, async (req, res) => {
  try {
    const md5Hash = req.params.md5Hash;
    
    // 在数据库中查找相同MD5的视频
    const existingVideo = await Video.findOne({
      where: {
        md5Hash: md5Hash,
        userId: req.user.id,
        status: { 
          [Op.notIn]: ['deleted', 'expired'] 
        }
      },
      attributes: ['id', 'originalVideo', 'size', 'dimensions', 'status']
    });
    
    if (existingVideo) {
      return res.status(200).json({
        exists: true,
        video: {
          id: existingVideo.id,
          originalVideo: existingVideo.originalVideo,
          size: existingVideo.size,
          dimensions: existingVideo.dimensions,
          status: existingVideo.status
        }
      });
    }
    
    // 未找到相同MD5的视频
    res.status(404).json({ exists: false });
  } catch (error) {
    console.error('检查视频失败:', error);
    res.status(500).json({ message: '检查视频失败', error: error.message });
  }
});

module.exports = router; 