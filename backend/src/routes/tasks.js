const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const { Op } = require('sequelize');
const { authenticate } = require('../middleware/auth');
const { Task, Video, Background, ModelUsage, InterfaceUsage, sequelize } = require('../models');

// 加载环境变量
dotenv.config();

const router = express.Router();

// 获取配置的上传路径
const UPLOAD_RESULTS_DIR = process.env.UPLOAD_RESULTS_DIR || 'uploads/results';
const UPLOAD_MASKS_DIR = process.env.UPLOAD_MASKS_DIR || 'uploads/masks';

// 获取当前用户的所有任务
router.get('/user', authenticate, async (req, res) => {
  try {
    const tasks = await Task.findByEmail(req.user.email);
    
    res.status(200).json({ tasks });
  } catch (error) {
    console.error('获取任务列表失败:', error);
    res.status(500).json({ message: '获取任务列表失败', error: error.message });
  }
});

// 获取特定任务详情
router.get('/user/:id', authenticate, async (req, res) => {
  try {
    const task = await Task.findOne({
      where: { 
        id: req.params.id,
        email: req.user.email
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
router.post('/create', authenticate, async (req, res) => {
  const { videoId, backgroundId, modelName, interfaceAddress } = req.body;
  
  if (!videoId) {
    return res.status(400).json({ message: '缺少必要参数: videoId' });
  }
  
  try {
    // 查找视频
    const video = await Video.findOne({
      where: { 
        id: videoId, 
        email: req.user.email,
        oriVideoStatus: { 
          [Op.notIn]: ['deleted', 'expired']
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
          email: req.user.email,
          backgroundStatus: 'exists'
        }
      });
      
      if (!background) {
        return res.status(404).json({ message: '背景图不存在' });
      }
    }
    
    // 记录模型使用情况
    const modelNameToUse = modelName || 'normal';
    await ModelUsage.incrementUsage(modelNameToUse);
    
    // 记录接口使用情况
    const interfaceToUse = interfaceAddress || 'default';
    await InterfaceUsage.incrementRequest(interfaceToUse);
    
    // 创建任务
    const task = await Task.create({
      email: req.user.email,
      interfaceAddress: interfaceToUse,
      oriVideoId: videoId,
      backgroundId: backgroundId || 0,
      oriVideoPath: video.oriVideoPath,
      foreVideoPath: video.foreVideoPath || '',
      backgroundPath: background ? background.backgroundPath : '',
      outputVideoPath: background ? path.join(UPLOAD_RESULTS_DIR, `result_${videoId}_${Date.now()}.mp4`).replace(/\\/g, '/') : '',
      taskStatus: 'waiting',
      modelName: modelNameToUse
    });
    
    // 更新视频和背景图使用次数
    video.oriVideoUsageCnt += 1;
    await video.save();
    
    if (background) {
      background.backgroundUsageCnt += 1;
      await background.save();
    }
    
    res.status(201).json({ 
      message: '任务创建成功',
      task: {
        id: task.id,
        taskStatus: task.taskStatus,
        taskStartTime: task.taskStartTime,
        oriVideoPath: task.oriVideoPath,
        backgroundPath: task.backgroundPath,
        modelName: task.modelName,
        // 返回视频和背景图的相关信息，以便前端可以显示
        video: {
          id: video.id,
          oriVideoPath: video.oriVideoPath,
          oriVideoStatus: video.oriVideoStatus
        },
        background: background ? {
          id: background.id,
          backgroundPath: background.backgroundPath
        } : null
      }
    });
  } catch (error) {
    console.error('创建任务失败:', error);
    res.status(500).json({ message: '创建任务失败', error: error.message });
  }
});

// 取消任务
router.delete('/cancel/:id', authenticate, async (req, res) => {
  try {
    const task = await Task.findOne({
      where: { 
        id: req.params.id,
        email: req.user.email,
        taskStatus: {
          [Op.in]: ['waiting', 'processing']
        }
      }
    });
    
    if (!task) {
      return res.status(404).json({ message: '任务不存在或无法取消' });
    }
    
    task.taskStatus = 'failed';
    await task.save();
    
    res.status(200).json({ message: '任务已取消' });
  } catch (error) {
    console.error('取消任务失败:', error);
    res.status(500).json({ message: '取消任务失败', error: error.message });
  }
});

// 获取任务状态
router.get('/status/:id', authenticate, async (req, res) => {
  try {
    const task = await Task.findOne({
      where: { 
        id: req.params.id,
        email: req.user.email
      },
      attributes: ['id', 'taskStatus', 'taskStartTime', 'taskUpdateTime', 'taskDuration', 'oriVideoPath', 'backgroundPath', 'foreVideoPath', 'outputVideoPath', 'modelName', 'interfaceAddress']
    });
    
    if (!task) {
      return res.status(404).json({ message: '任务不存在' });
    }
    
    // 如果任务有接口地址，记录接口响应
    if (task.interfaceAddress) {
      // 如果任务已完成，记录成功响应
      const isSuccess = task.taskStatus === 'completed';
      await InterfaceUsage.incrementResponse(task.interfaceAddress, isSuccess);
    }
    
    // 获取关联的视频和背景图信息
    let videoInfo = null;
    let backgroundInfo = null;
    
    if (task.oriVideoId) {
      const video = await Video.findOne({
        where: {
          id: task.oriVideoId
        },
        attributes: ['id', 'oriVideoPath', 'oriVideoStatus', 'oriVideoSize', 'oriVideoDim']
      });
      
      if (video) {
        videoInfo = {
          id: video.id,
          path: video.oriVideoPath,
          status: video.oriVideoStatus,
          size: video.oriVideoSize,
          dimensions: video.oriVideoDim
        };
      }
    }
    
    if (task.backgroundId) {
      const background = await Background.findOne({
        where: {
          id: task.backgroundId
        },
        attributes: ['id', 'backgroundPath', 'backgroundSize', 'backgroundDim']
      });
      
      if (background) {
        backgroundInfo = {
          id: background.id,
          path: background.backgroundPath,
          size: background.backgroundSize,
          dimensions: background.backgroundDim
        };
      }
    }
    
    res.status(200).json({ 
      taskId: task.id,
      status: task.taskStatus,
      startTime: task.taskStartTime,
      updateTime: task.taskUpdateTime,
      duration: task.taskDuration,
      oriVideoPath: task.oriVideoPath,
      backgroundPath: task.backgroundPath,
      foreVideoPath: task.foreVideoPath,
      outputVideoPath: task.outputVideoPath,
      modelName: task.modelName,
      video: videoInfo,
      background: backgroundInfo
    });
  } catch (error) {
    console.error('获取任务状态失败:', error);
    res.status(500).json({ message: '获取任务状态失败', error: error.message });
  }
});

// 获取模型使用统计 (管理员路由)
router.get('/admin/models', authenticate, async (req, res) => {
  try {
    // 验证用户是否有管理员权限
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: '没有权限访问' });
    }
    
    const modelUsages = await ModelUsage.findAll({
      order: [['modelUsageCnt', 'DESC']]
    });
    
    res.status(200).json({ modelUsages });
  } catch (error) {
    console.error('获取模型使用统计失败:', error);
    res.status(500).json({ message: '获取模型使用统计失败', error: error.message });
  }
});

// 获取接口使用统计 (管理员路由)
router.get('/admin/interfaces', authenticate, async (req, res) => {
  try {
    // 验证用户是否有管理员权限
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: '没有权限访问' });
    }
    
    const interfaceUsages = await InterfaceUsage.findAll({
      order: [['requestCnt', 'DESC']]
    });
    
    res.status(200).json({ interfaceUsages });
  } catch (error) {
    console.error('获取接口使用统计失败:', error);
    res.status(500).json({ message: '获取接口使用统计失败', error: error.message });
  }
});

module.exports = router; 