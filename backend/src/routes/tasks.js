const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const { Op } = require('sequelize');
const { authenticate } = require('../middleware/auth');
const { Task, Video, Background, ModelUsage, InterfaceUsage, sequelize } = require('../models');
const config = require('../config');
const logger = require('../utils/logger');

// 加载环境变量
dotenv.config();

const router = express.Router();

// 获取当前用户的所有任务
router.get('/user', authenticate, async (req, res) => {
  try {
    // 使用连接查询获取任务以及关联的视频和背景信息
    const tasks = await Task.findAll({
      where: { email: req.user.email },
      order: [['taskStartTime', 'DESC']],
      include: [
        {
          model: Video,
          as: 'video',
          attributes: ['id', 'oriVideoName', 'oriVideoDim', 'oriVideoDuration', 'oriVideoSize'],
          required: false
        },
        {
          model: Background,
          as: 'background',
          attributes: ['id', 'backgroundName', 'backgroundDim', 'backgroundSize'],
          required: false
        }
      ],
      attributes: { 
        exclude: ['modelName'] // 排除modelName字段，但保留所有其他字段，包括modelAlias
      }
    });
    
    // 格式化数据以包含更多信息
    const formattedTasks = tasks.map(task => {
      const plainTask = task.get({ plain: true });
      return {
        ...plainTask,
        videoName: plainTask.video ? plainTask.video.oriVideoName : null,
        videoDim: plainTask.video ? plainTask.video.oriVideoDim : null, 
        videoDuration: plainTask.video ? plainTask.video.oriVideoDuration : null,
        videoSize: plainTask.video ? plainTask.video.oriVideoSize : null,
        backgroundName: plainTask.background ? plainTask.background.backgroundName : null,
        backgroundDim: plainTask.background ? plainTask.background.backgroundDim : null,
        backgroundSize: plainTask.background ? plainTask.background.backgroundSize : null,
        // 确保modelAlias字段存在，如果为空则使用默认值
        modelAlias: plainTask.modelAlias || '未知模型'
      };
    });
    
    res.status(200).json(formattedTasks);
  } catch (error) {
    logger.error('获取任务列表失败:', { error: error.message, stack: error.stack });
    res.status(500).json({ message: '获取任务列表失败', error: error.message });
  }
});

/**
 * @api {get} /api/tasks/user/frozen-balance 获取用户已冻结余额
 * @apiDescription 获取用户当前进行中任务已冻结的余额总和
 * @apiGroup Tasks
 */
router.get('/user/frozen-balance', authenticate, async (req, res) => {
  try {
    const userEmail = req.user.email;
    
    // 获取用户所有处于进行中状态的任务
    const runningTasks = await Task.findAll({
      where: {
        email: userEmail,
        taskStatus: ['waiting', 'processing'] // 只考虑等待中和处理中的任务
      },
      include: [{
        model: ModelUsage,
        as: 'model',
        attributes: ['pricePerFrame']
      }],
      include: [{
        model: Video,
        as: 'video',
        attributes: ['oriVideoFrameCnt']
      }]
    });
    
    // 计算所有进行中任务的费用总和
    let frozenBalance = 0;
    
    for (const task of runningTasks) {
      // 获取视频帧数
      const frameCnt = task.video?.oriVideoFrameCnt || 0;
      
      // 获取模型单价
      const modelUsage = await ModelUsage.findOne({
        where: { modelAlias: task.modelAlias }
      });
      const pricePerFrame = modelUsage?.pricePerFrame || 0.01;
      
      // 计算任务费用并累加
      const taskCost = frameCnt * pricePerFrame;
      frozenBalance += taskCost;
      
      logger.debug('计算任务冻结金额', {
        taskId: task.id,
        frameCnt,
        pricePerFrame,
        taskCost
      });
    }
    
    logger.info('获取用户冻结余额', {
      userEmail,
      frozenBalance,
      runningTaskCount: runningTasks.length,
      requestId: req.requestId
    });
    
    res.json({ frozenBalance });
    
  } catch (error) {
    logger.error('获取冻结余额失败', {
      error: error.message,
      stack: error.stack,
      userEmail: req.user?.email,
      requestId: req.requestId
    });
    
    res.status(500).json({
      message: '获取冻结余额失败',
      error: error.message
    });
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
    
    // 去除modelName字段
    const taskObj = task.get({ plain: true });
    const { modelName, ...taskWithoutModelName } = taskObj;
    
    res.status(200).json({ task: taskWithoutModelName });
  } catch (error) {
    logger.error('获取任务详情失败:', { error: error.message, stack: error.stack });
    res.status(500).json({ message: '获取任务详情失败', error: error.message });
  }
});

// 创建新任务
router.post('/create', authenticate, async (req, res) => {
  const { videoId, backgroundId, modelName, modelAlias, interfaceAddress } = req.body;
  
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
    
    // 设置模型信息
    let modelNameToUse = '';
    let modelAliasToUse = modelAlias || '';
    
    // 查找是否已存在传入的modelAlias对应的模型
    let modelInfo = null;
    if (modelAlias) {
      // 通过modelAlias查找
      modelInfo = await ModelUsage.findOne({
        where: { modelAlias }
      });
    } else if (modelName) {
      // 兼容旧的处理方式，通过modelName查找
      modelInfo = await ModelUsage.findByModelName(modelName);
    }
    
    if (modelInfo) {
      // 使用找到的模型信息
      modelNameToUse = modelInfo.modelName;
      modelAliasToUse = modelInfo.modelAlias;
    } 
    
    logger.info('创建任务使用模型:', { 
      requestId: req.requestId,
      modelNameToUse, 
      modelAliasToUse, 
      前端传入: { modelName, modelAlias } 
    });
    
    // 创建任务
    const task = await Task.create({
      email: req.user.email,
      interfaceAddress: '',
      oriVideoId: videoId,
      backgroundId: backgroundId,
      oriVideoPath: video.oriVideoPath,
      foreVideoPath: '',
      backgroundPath: background.backgroundPath,
      outputVideoPath: '',
      taskStatus: 'waiting',
      modelName: modelNameToUse,
      modelAlias: modelAliasToUse // 设置模型别名
    });
    
    res.status(201).json({ 
      message: '任务创建成功',
      task: {
        id: task.id,
        taskStatus: task.taskStatus,
        taskStartTime: task.taskStartTime,
        oriVideoPath: task.oriVideoPath,
        backgroundPath: task.backgroundPath,
        modelAlias: task.modelAlias, // 只返回模型别名，不返回modelName
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
    logger.error('创建任务失败:', { 
      requestId: req.requestId,
      error: error.message,
      stack: error.stack
    });
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
    logger.error('取消任务失败:', { 
      requestId: req.requestId,
      error: error.message,
      stack: error.stack
    });
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
      attributes: ['id', 'taskStatus', 'taskStartTime', 'taskUpdateTime', 'taskDuration', 'oriVideoPath', 'backgroundPath', 'foreVideoPath', 'outputVideoPath', 'modelAlias', 'interfaceAddress']
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
      modelAlias: task.modelAlias, // 只返回模型别名
      video: videoInfo,
      background: backgroundInfo
    });
  } catch (error) {
    logger.error('获取任务状态失败:', { 
      requestId: req.requestId,
      error: error.message,
      stack: error.stack
    });
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
    
    // 过滤掉敏感信息，只返回modelAlias和使用统计
    const filteredUsages = modelUsages.map(model => {
      const modelData = model.get({ plain: true });
      const { modelName, ...filteredData } = modelData;
      return filteredData;
    });
    
    res.status(200).json({ modelUsages: filteredUsages });
  } catch (error) {
    logger.error('获取模型使用统计失败:', { error: error.message, stack: error.stack });
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
    logger.error('获取接口使用统计失败:', { error: error.message, stack: error.stack });
    res.status(500).json({ message: '获取接口使用统计失败', error: error.message });
  }
});

// 获取可用模型列表
router.get('/models', authenticate, async (req, res) => {
  try {
    const models = await ModelUsage.getAvailableModels();
    
    res.status(200).json({
      models: models.map(model => ({
        modelAlias: model.modelAlias || model.modelName,
        modelDescription: model.modelDescription || ''
      }))
    });
  } catch (error) {
    logger.error('获取可用模型列表失败:', { error: error.message, stack: error.stack });
    res.status(500).json({ message: '获取可用模型列表失败', error: error.message });
  }
});

// 任务回调接口 - 由接口服务调用更新任务状态
router.post('/callback', async (req, res) => {
  const { Identification, taskId, workerUrl, status, progress, message } = req.body;

  logger.info('收到任务回调:', { 
    requestId: req.requestId,
    taskId, 
    workerUrl, 
    status, 
    progress 
  });
  
  // 验证必要参数
  if (!taskId || !Identification || !status) {
    return res.status(400).json({ success: false, message: '缺少必要参数' });
  }
  
  // 验证身份标识
  if (Identification !== config.INTERFACE_IDENTIFICATION) {
    return res.status(403).json({ success: false, message: '身份标识无效' });
  }
  
  try {
    // 1. 查找任务
    const task = await Task.findByPk(taskId);
    
    if (!task) {
      return res.status(404).json({ success: false, message: '任务不存在' });
    }
    
    // 2. 更新任务状态
    let shouldReleaseInterface = false;
    
    switch (status.toLowerCase()) {
      case 'processing':
        task.taskStatus = 'processing';
        task.taskProgress = progress || task.taskProgress;
        break;
      
      case 'completed':
        task.taskStatus = 'completed';
        task.taskProgress = 100;
        task.taskUpdateTime = new Date();
        shouldReleaseInterface = true;
        break;
      
      case 'failed':
        task.taskStatus = 'failed';
        task.taskUpdateTime = new Date();
        shouldReleaseInterface = true;
        break;
        
      default:
        return res.status(400).json({ success: false, message: '无效的状态' });
    }
    
    // 更新任务消息
    if (message) {
      task.taskRespose = message;
    }
    
    await task.save();
    
    logger.info(`任务 #${taskId} 状态更新为: ${task.taskStatus}, 进度: ${task.taskProgress}%, 消息: ${message || '无'}`, {
      requestId: req.requestId,
      taskId,
      status: task.taskStatus,
      progress: task.taskProgress,
      message: message || '无'
    });
    
    // 3. 如果任务完成或失败，释放接口资源
    if (shouldReleaseInterface && task.interfaceAddress) {
      logger.info(`释放接口: ${task.interfaceAddress}`, {
        requestId: req.requestId,
        taskId,
        interfaceAddress: task.interfaceAddress
      });
      
      // 更新接口使用统计
      if (status.toLowerCase() === 'completed') {
        await InterfaceUsage.incrementResponse(task.interfaceAddress, true);
      } else {
        await InterfaceUsage.incrementResponse(task.interfaceAddress, false);
      }
      
      // 释放接口，使其可以处理下一个任务
      await InterfaceUsage.releaseInterface(task.interfaceAddress);
    }
    
    res.status(200).json({ success: true, message: '任务状态已更新' });
  } catch (error) {
    logger.error('更新任务状态失败:', { 
      requestId: req.requestId,
      taskId,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ success: false, message: '更新任务状态失败', error: error.message });
  }
});

// 接口心跳接口 - 由接口服务定期调用，表明接口仍在运行
router.post('/interface/heartbeat', async (req, res) => {
  const { interfaceAddress, Identification } = req.body;
  
  // 验证必要参数
  if (!interfaceAddress || !Identification) {
    return res.status(400).json({ success: false, message: '缺少必要参数' });
  }
  
  // 验证身份标识
  if (Identification !== config.INTERFACE_IDENTIFICATION) {
    return res.status(403).json({ success: false, message: '身份标识无效' });
  }
  
  try {
    // 更新接口心跳时间
    await InterfaceUsage.updateHeartbeat(interfaceAddress);
    
    logger.debug(`接收到接口心跳: ${interfaceAddress}`, {
      requestId: req.requestId,
      interfaceAddress
    });
    
    res.status(200).json({ success: true, message: '心跳已更新' });
  } catch (error) {
    logger.error('更新接口心跳失败:', { 
      requestId: req.requestId,
      interfaceAddress,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ success: false, message: '更新心跳失败', error: error.message });
  }
});

module.exports = router; 