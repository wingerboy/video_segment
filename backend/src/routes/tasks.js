const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const { authenticate } = require('../middleware/auth');
const { Task, Video, Background, sequelize } = require('../models');

// 加载环境变量
dotenv.config();

const router = express.Router();

// 获取配置的上传路径
const UPLOAD_RESULTS_DIR = process.env.UPLOAD_RESULTS_DIR || 'uploads/results';
const UPLOAD_MASKS_DIR = process.env.UPLOAD_MASKS_DIR || 'uploads/masks';

// 获取当前用户的所有任务
router.get('/', authenticate, async (req, res) => {
  try {
    const tasks = await Task.findAll({
      where: { userId: req.user.id },
      order: [['startTime', 'DESC']]
    });
    
    res.status(200).json({ tasks });
  } catch (error) {
    console.error('获取任务列表失败:', error);
    res.status(500).json({ message: '获取任务列表失败', error: error.message });
  }
});

// 获取特定任务详情
router.get('/:id', authenticate, async (req, res) => {
  try {
    const task = await Task.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id
      }
    });
    
    if (!task) {
      return res.status(404).json({ message: '任务不存在' });
    }
    
    res.status(200).json({ task });
  } catch (error) {
    console.error('获取任务详情失败:', error);
    res.status(500).json({ message: '获取任务详情失败', error: error.message });
  }
});

// 创建新任务
router.post('/', authenticate, async (req, res) => {
  const { videoId, backgroundId, modelId } = req.body;
  
  if (!videoId) {
    return res.status(400).json({ message: '缺少必要参数: videoId' });
  }
  
  try {
    // 查找视频
    const video = await Video.findOne({
      where: { 
        id: videoId, 
        userId: req.user.id,
        status: { 
          [sequelize.Op.notIn]: ['deleted', 'expired'] 
        }
      }
    });
    
    if (!video) {
      return res.status(404).json({ message: '视频不存在' });
    }
    
    // 验证背景图（如果指定）
    let background = null;
    if (backgroundId) {
      background = await Background.findOne({
        where: { 
          id: backgroundId, 
          userId: req.user.id,
          status: 'active'
        }
      });
      
      if (!background) {
        return res.status(404).json({ message: '背景图不存在' });
      }
    }
    
    // 创建任务
    const task = await Task.create({
      userId: req.user.id,
      sourceVideoMd5: video.md5Hash,
      sourceVideoPath: video.originalVideo,
      backgroundPath: background ? background.path : null,
      status: 'waiting',
      // 为生成的文件预先设置路径
      maskPath: background ? path.join(UPLOAD_MASKS_DIR, `mask_${video.id}_${Date.now()}.mp4`).replace(/\\/g, '/') : null,
      outputVideoPath: background ? path.join(UPLOAD_RESULTS_DIR, `result_${video.id}_${Date.now()}.mp4`).replace(/\\/g, '/') : null
    });
    
    // 更新视频和背景图使用次数
    video.usageCount += 1;
    await video.save();
    
    if (background) {
      background.usageCount += 1;
      await background.save();
      
      // 更新视频的背景图引用 - 确保视频分割任务和仪表盘共享同一个背景图引用
      if (!video.backgroundImage) {
        video.backgroundImage = background.path;
        await video.save();
      }
    }
    
    res.status(201).json({ 
      message: '任务创建成功',
      task: {
        id: task.id,
        status: task.status,
        startTime: task.startTime,
        sourceVideoPath: task.sourceVideoPath,
        backgroundPath: task.backgroundPath,
        // 返回视频和背景图的相关信息，以便前端可以显示
        video: {
          id: video.id,
          originalVideo: video.originalVideo,
          status: video.status
        },
        background: background ? {
          id: background.id,
          path: background.path
        } : null
      }
    });
  } catch (error) {
    console.error('创建任务失败:', error);
    res.status(500).json({ message: '创建任务失败', error: error.message });
  }
});

// 取消任务
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const task = await Task.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id,
        status: {
          [sequelize.Op.in]: ['waiting', 'processing']
        }
      }
    });
    
    if (!task) {
      return res.status(404).json({ message: '任务不存在或无法取消' });
    }
    
    task.status = 'failed';
    await task.save();
    
    res.status(200).json({ message: '任务已取消' });
  } catch (error) {
    console.error('取消任务失败:', error);
    res.status(500).json({ message: '取消任务失败', error: error.message });
  }
});

// 获取任务状态
router.get('/:id/status', authenticate, async (req, res) => {
  try {
    const task = await Task.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id
      },
      attributes: ['id', 'status', 'startTime', 'updateTime', 'duration', 'sourceVideoPath', 'backgroundPath', 'maskPath', 'outputVideoPath']
    });
    
    if (!task) {
      return res.status(404).json({ message: '任务不存在' });
    }
    
    // 获取关联的视频和背景图信息
    let videoInfo = null;
    let backgroundInfo = null;
    
    if (task.sourceVideoPath) {
      const video = await Video.findOne({
        where: {
          userId: req.user.id,
          originalVideo: task.sourceVideoPath
        },
        attributes: ['id', 'originalVideo', 'status', 'size', 'dimensions']
      });
      
      if (video) {
        videoInfo = {
          id: video.id,
          path: video.originalVideo,
          status: video.status,
          size: video.size,
          dimensions: video.dimensions
        };
      }
    }
    
    if (task.backgroundPath) {
      const background = await Background.findOne({
        where: {
          userId: req.user.id,
          path: task.backgroundPath
        },
        attributes: ['id', 'path', 'size', 'dimensions']
      });
      
      if (background) {
        backgroundInfo = {
          id: background.id,
          path: background.path,
          size: background.size,
          dimensions: background.dimensions
        };
      }
    }
    
    res.status(200).json({ 
      taskId: task.id,
      status: task.status,
      startTime: task.startTime,
      updateTime: task.updateTime,
      duration: task.duration,
      sourceVideoPath: task.sourceVideoPath,
      backgroundPath: task.backgroundPath,
      maskPath: task.maskPath,
      outputVideoPath: task.outputVideoPath,
      video: videoInfo,
      background: backgroundInfo
    });
  } catch (error) {
    console.error('获取任务状态失败:', error);
    res.status(500).json({ message: '获取任务状态失败', error: error.message });
  }
});

module.exports = router; 