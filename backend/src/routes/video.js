const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const { Video } = require('../models');
const { extractVideoQueue, applyBackgroundQueue } = require('../services/queue');

const router = express.Router();

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
    cb(null, path.join(__dirname, '../../uploads'));
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
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// Upload original video
router.post('/upload', auth, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No video file uploaded' });
    }
    
    // Create new video entry
    const video = await Video.create({
      userId: req.user.id,
      originalVideo: `uploads/${req.file.filename}`
    });
    
    // Add to extract video queue
    await extractVideoQueue.add({
      videoId: video.id
    });
    
    res.status(201).json({
      message: 'Video uploaded successfully',
      video: {
        id: video.id,
        originalVideo: video.originalVideo,
        status: video.status
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Video upload failed', error: error.message });
  }
});

// Upload background image
router.post('/background/:id', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded' });
    }
    
    const video = await Video.findOne({ 
      where: { 
        id: req.params.id, 
        userId: req.user.id 
      }
    });
    
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    // Save background image path
    video.backgroundImage = `uploads/${req.file.filename}`;
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
router.get('/', auth, async (req, res) => {
  try {
    const videos = await Video.findAll({ 
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    
    res.status(200).json({
      videos: videos.map(video => ({
        id: video.id,
        originalVideo: video.originalVideo,
        extractedForeground: video.extractedForeground,
        backgroundImage: video.backgroundImage,
        finalVideo: video.finalVideo,
        status: video.status,
        createdAt: video.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get videos', error: error.message });
  }
});

// Get video by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const video = await Video.findOne({ 
      where: { 
        id: req.params.id, 
        userId: req.user.id 
      }
    });
    
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    res.status(200).json({
      video: {
        id: video.id,
        originalVideo: video.originalVideo,
        extractedForeground: video.extractedForeground,
        backgroundImage: video.backgroundImage,
        finalVideo: video.finalVideo,
        status: video.status,
        createdAt: video.createdAt,
        updatedAt: video.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get video', error: error.message });
  }
});

// Delete video
router.delete('/:id', auth, async (req, res) => {
  try {
    const video = await Video.findOne({ 
      where: { 
        id: req.params.id, 
        userId: req.user.id 
      }
    });
    
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    // Delete video files
    const filesToDelete = [
      video.originalVideo, 
      video.extractedForeground, 
      video.backgroundImage, 
      video.finalVideo
    ].filter(Boolean);
    
    filesToDelete.forEach(filePath => {
      const fullPath = path.join(__dirname, '../../', filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    });
    
    // Delete from database
    await video.destroy();
    
    res.status(200).json({ message: 'Video deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete video', error: error.message });
  }
});

module.exports = router; 