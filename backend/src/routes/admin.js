const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { authenticate, isAdmin } = require('../middleware/auth');
const { User, InterfaceUsage, Transaction, Task, ModelUsage } = require('../models');
const sequelize = require('../models/db');

// ============= 用户管理相关API =============

/**
 * @api {get} /admin/users 获取所有用户列表
 */
router.get('/users', authenticate, isAdmin, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: [
        'id', 'username', 'email', 'role', 'userStatus', 
        'balance', 'rechargeAmount', 'consumeAmount', 'transferAmount',
        'createdAt', 'updatedAt'
      ]
    });
    
    res.status(200).json(users);
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({ 
      message: '获取用户列表失败', 
      error: error.message 
    });
  }
});

/**
 * @api {put} /admin/users/:userId/role 更新用户角色
 */
router.put('/users/:userId/role', authenticate, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    
    if (!role || !['user', 'agent', 'admin'].includes(role)) {
      return res.status(400).json({ message: '无效的角色值' });
    }
    
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    user.role = role;
    await user.save();
    
    res.status(200).json({
      message: '用户角色已更新',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        userStatus: user.userStatus
      }
    });
  } catch (error) {
    console.error('更新用户角色失败:', error);
    res.status(500).json({ 
      message: '更新用户角色失败', 
      error: error.message 
    });
  }
});

/**
 * @api {put} /admin/users/:userId/status 更新用户状态
 */
router.put('/users/:userId/status', authenticate, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { userStatus } = req.body;
    
    if (!userStatus || !['active', 'banned'].includes(userStatus)) {
      return res.status(400).json({ message: '无效的状态值' });
    }
    
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    user.userStatus = userStatus;
    await user.save();
    
    res.status(200).json({
      message: '用户状态已更新',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        userStatus: user.userStatus
      }
    });
  } catch (error) {
    console.error('更新用户状态失败:', error);
    res.status(500).json({ 
      message: '更新用户状态失败', 
      error: error.message 
    });
  }
});

/**
 * @api {post} /admin/users/:userId/recharge 管理员为用户充值
 */
router.post('/users/:userId/recharge', authenticate, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount, paymentId, description } = req.body;
    
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({ message: '请提供有效的充值金额' });
    }
    
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    // 创建一个事务
    const transaction = await Transaction.create({
      userId: user.id,
      amount: parseFloat(amount),
      type: 'recharge',
      status: 'completed',
      paymentId: paymentId || null,
      description: description || '管理员手动充值',
      operatorId: req.user.id,
      operatorName: req.user.username
    });
    
    // 更新用户余额
    user.balance = parseFloat(user.balance) + parseFloat(amount);
    user.rechargeAmount = parseFloat(user.rechargeAmount) + parseFloat(amount);
    await user.save();
    
    res.status(200).json({
      message: '用户充值成功',
      transaction,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        balance: user.balance
      }
    });
  } catch (error) {
    console.error('管理员充值失败:', error);
    res.status(500).json({ 
      message: '管理员充值失败', 
      error: error.message 
    });
  }
});

// ============= AI服务接口管理相关API =============

/**
 * @api {get} /admin/interfaces 获取所有接口列表
 */
router.get('/interfaces', authenticate, isAdmin, async (req, res) => {
  try {
    const interfaces = await InterfaceUsage.findAll({
      order: [['updatedAt', 'DESC']]
    });
    
    res.status(200).json(interfaces);
  } catch (error) {
    console.error('获取接口列表失败:', error);
    res.status(500).json({ 
      message: '获取接口列表失败', 
      error: error.message 
    });
  }
});

/**
 * @api {post} /admin/interfaces 添加新接口
 */
router.post('/interfaces', authenticate, isAdmin, async (req, res) => {
  try {
    const { interfaceAddress, status = 'idle', description } = req.body;
    
    if (!interfaceAddress) {
      return res.status(400).json({ message: '接口地址不能为空' });
    }
    
    // 检查接口是否已存在
    const existingInterface = await InterfaceUsage.findOne({
      where: { interfaceAddress }
    });
    
    if (existingInterface) {
      return res.status(400).json({ message: '该接口地址已存在' });
    }
    
    // 创建新接口
    const newInterface = await InterfaceUsage.create({
      interfaceAddress,
      status: status,
      currentTaskId: null,
      currentTaskMessage: null,
      requestCnt: 0,
      resposeCnt: 0,
      succCnt: 0,
      lastHeartbeat: new Date()
    });
    
    res.status(201).json({
      message: '接口添加成功',
      interface: newInterface
    });
  } catch (error) {
    console.error('添加接口失败:', error);
    res.status(500).json({ 
      message: '添加接口失败', 
      error: error.message 
    });
  }
});

/**
 * @api {put} /admin/interfaces/:interfaceId/status 更新接口状态
 */
router.put('/interfaces/:interfaceId/status', authenticate, isAdmin, async (req, res) => {
  try {
    const { interfaceId } = req.params;
    const { status } = req.body;
    
    if (!status || !['idle', 'busy', 'offline'].includes(status)) {
      return res.status(400).json({ message: '无效的状态值' });
    }
    
    const interfaceUsage = await InterfaceUsage.findByPk(interfaceId);
    if (!interfaceUsage) {
      return res.status(404).json({ message: '接口不存在' });
    }
    
    interfaceUsage.status = status;
    
    // 如果设置为空闲，清除当前任务信息
    if (status === 'idle') {
      interfaceUsage.currentTaskId = null;
      interfaceUsage.currentTaskMessage = null;
    }
    
    await interfaceUsage.save();
    
    res.status(200).json({
      message: '接口状态已更新',
      interface: interfaceUsage
    });
  } catch (error) {
    console.error('更新接口状态失败:', error);
    res.status(500).json({ 
      message: '更新接口状态失败', 
      error: error.message 
    });
  }
});

// ============= 统计相关API =============

/**
 * @api {get} /admin/stats/tasks 获取任务统计
 */
router.get('/stats/tasks', authenticate, isAdmin, async (req, res) => {
  try {
    const { timeRange } = req.query;
    let where = {};
    
    // 根据时间范围筛选
    if (timeRange) {
      const now = new Date();
      let startDate;
      
      switch (timeRange) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        default:
          startDate = null;
      }
      
      if (startDate) {
        where.createdAt = { [Op.gte]: startDate };
      }
    }
    
    // 获取任务总数
    const totalTasks = await Task.count({ where });
    
    // 按状态分组
    const tasksByStatus = await Task.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where,
      group: ['status']
    });
    
    // 转换结果为更易用的格式
    const statusCounts = {};
    tasksByStatus.forEach(item => {
      statusCounts[item.status] = parseInt(item.getDataValue('count'));
    });
    
    // 获取最近10个任务
    const recentTasks = await Task.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: 10,
      include: [
        {
          model: User,
          attributes: ['username', 'email']
        }
      ]
    });
    
    res.status(200).json({
      totalTasks,
      statusCounts,
      recentTasks
    });
  } catch (error) {
    console.error('获取任务统计失败:', error);
    res.status(500).json({ 
      message: '获取任务统计失败', 
      error: error.message 
    });
  }
});

/**
 * @api {get} /admin/stats/users 获取用户统计
 */
router.get('/stats/users', authenticate, isAdmin, async (req, res) => {
  try {
    // 获取用户总数
    const totalUsers = await User.count();
    
    // 按角色分组
    const usersByRole = await User.findAll({
      attributes: [
        'role',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['role']
    });
    
    // 转换结果为更易用的格式
    const roleCounts = {};
    usersByRole.forEach(item => {
      roleCounts[item.role] = parseInt(item.getDataValue('count'));
    });
    
    // 按状态分组
    const usersByStatus = await User.findAll({
      attributes: [
        'userStatus',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['userStatus']
    });
    
    // 转换结果为更易用的格式
    const statusCounts = {};
    usersByStatus.forEach(item => {
      statusCounts[item.userStatus] = parseInt(item.getDataValue('count'));
    });
    
    // 获取新注册用户（最近7天）
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const newUsers = await User.count({
      where: {
        createdAt: { [Op.gte]: sevenDaysAgo }
      }
    });
    
    // 获取总余额和消费情况
    const aggregates = await User.findAll({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('balance')), 'totalBalance'],
        [sequelize.fn('SUM', sequelize.col('rechargeAmount')), 'totalRecharge'],
        [sequelize.fn('SUM', sequelize.col('consumeAmount')), 'totalConsume']
      ]
    });
    
    const financialStats = aggregates[0].dataValues;
    
    res.status(200).json({
      totalUsers,
      roleCounts,
      statusCounts,
      newUsers,
      financialStats
    });
  } catch (error) {
    console.error('获取用户统计失败:', error);
    res.status(500).json({ 
      message: '获取用户统计失败', 
      error: error.message 
    });
  }
});

// ============= 模型管理相关API =============

/**
 * @api {get} /admin/models 获取所有模型列表
 */
router.get('/models', authenticate, isAdmin, async (req, res) => {
  try {
    const models = await ModelUsage.findAll({
      order: [['updatedAt', 'DESC']]
    });
    
    res.status(200).json(models);
  } catch (error) {
    console.error('获取模型列表失败:', error);
    res.status(500).json({ 
      message: '获取模型列表失败', 
      error: error.message 
    });
  }
});

/**
 * @api {post} /admin/models 添加新模型
 */
router.post('/models', authenticate, isAdmin, async (req, res) => {
  try {
    const { modelName, modelAlias, modelDescription } = req.body;
    
    if (!modelName) {
      return res.status(400).json({ message: '模型名称不能为空' });
    }
    
    // 检查模型是否已存在
    const existingModel = await ModelUsage.findOne({
      where: { modelName }
    });
    
    if (existingModel) {
      return res.status(400).json({ message: '该模型名称已存在' });
    }
    
    // 创建新模型
    const newModel = await ModelUsage.create({
      modelName,
      modelAlias: modelAlias || modelName,
      modelDescription: modelDescription || '',
      modelUsageCnt: 0
    });
    
    res.status(201).json({
      message: '模型添加成功',
      model: newModel
    });
  } catch (error) {
    console.error('添加模型失败:', error);
    res.status(500).json({ 
      message: '添加模型失败', 
      error: error.message 
    });
  }
});

/**
 * @api {put} /admin/models/:modelId 更新模型信息
 */
router.put('/models/:modelId', authenticate, isAdmin, async (req, res) => {
  try {
    const { modelId } = req.params;
    const { modelName, modelAlias, modelDescription } = req.body;
    
    const model = await ModelUsage.findByPk(modelId);
    if (!model) {
      return res.status(404).json({ message: '模型不存在' });
    }
    
    // 如果更新了模型名称，检查新名称是否已存在
    if (modelName && modelName !== model.modelName) {
      const existingModel = await ModelUsage.findOne({
        where: { 
          modelName,
          id: { [Op.ne]: modelId } // 排除当前模型
        }
      });
      
      if (existingModel) {
        return res.status(400).json({ message: '该模型名称已存在' });
      }
      
      model.modelName = modelName;
    }
    
    // 更新其他字段
    if (modelAlias !== undefined) model.modelAlias = modelAlias;
    if (modelDescription !== undefined) model.modelDescription = modelDescription;
    
    await model.save();
    
    res.status(200).json({
      message: '模型更新成功',
      model
    });
  } catch (error) {
    console.error('更新模型失败:', error);
    res.status(500).json({ 
      message: '更新模型失败', 
      error: error.message 
    });
  }
});

/**
 * @api {delete} /admin/models/:modelId 删除模型
 */
router.delete('/models/:modelId', authenticate, isAdmin, async (req, res) => {
  try {
    const { modelId } = req.params;
    
    const model = await ModelUsage.findByPk(modelId);
    if (!model) {
      return res.status(404).json({ message: '模型不存在' });
    }
    
    // 检查模型是否正在使用
    const tasksUsingModel = await Task.count({
      where: { modelName: model.modelName }
    });
    
    if (tasksUsingModel > 0) {
      return res.status(400).json({ 
        message: '无法删除正在使用的模型，该模型已被任务引用',
        tasksCount: tasksUsingModel 
      });
    }
    
    await model.destroy();
    
    res.status(200).json({
      message: '模型删除成功'
    });
  } catch (error) {
    console.error('删除模型失败:', error);
    res.status(500).json({ 
      message: '删除模型失败', 
      error: error.message 
    });
  }
});

router.delete('/admin/interfaces/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await InterfaceUsage.destroy({ where: { id } });
    return res.status(200).json({ success: true, message: '接口删除成功' });
  } catch (error) {
    console.error('删除接口失败:', error);
    return res.status(500).json({ success: false, message: '删除接口失败', error: error.message });
  }
});

module.exports = router; 