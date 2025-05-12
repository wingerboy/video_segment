const express = require('express');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { authenticate } = require('../middleware/auth');
const { Op } = require('sequelize');
const config = require('../config');
const logger = require('../utils/logger');

const router = express.Router();

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

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    logger.auth('正在注册新用户', { 
      username,
      email,
      requestId: req.requestId,
      ip: req.ip
    });
    
    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { username }]
      }
    });
    
    if (existingUser) {
      logger.auth('注册失败: 用户名或邮箱已被使用', { 
        username,
        email,
        existingUsername: existingUser.username,
        existingEmail: existingUser.email,
        requestId: req.requestId
      });
      return res.status(400).json({ message: 'Username or email already in use' });
    }
    
    // Create new user
    const user = await User.create({
      username,
      email,
      password,
      userStatus: 'active',
      role: 'user'
    });
    
    // Generate JWT token
    const token = jwt.sign({ id: user.id, email: user.email }, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRES_IN
    });
    
    logger.auth('用户注册成功', { 
      userId: user.id,
      username: user.username,
      email: user.email,
      requestId: req.requestId
    });
    
    // 设置用户上下文
    logger.setUserContext(user.email);
    
    res.status(201).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        userStatus: user.userStatus,
        balance: user.balance
      }
    });
  } catch (error) {
    logger.error('用户注册失败', { 
      error: error.message, 
      stack: error.stack,
      requestId: req.requestId,
      username: req.body?.username,
      email: req.body?.email
    });
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    logger.auth('用户尝试登录', { 
      email,
      requestId: req.requestId,
      ip: req.ip
    });
    
    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      logger.auth('登录失败: 用户不存在', { 
        email,
        requestId: req.requestId
      });
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check if user is banned
    if (user.userStatus === 'banned') {
      logger.auth('登录失败: 用户已被封禁', { 
        userId: user.id,
        email: user.email,
        requestId: req.requestId
      });
      return res.status(403).json({ message: 'Your account has been banned' });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      logger.auth('登录失败: 密码错误', { 
        userId: user.id,
        email: user.email,
        requestId: req.requestId
      });
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign({ id: user.id, email: user.email }, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRES_IN
    });
    
    logger.auth('用户登录成功', { 
      userId: user.id,
      email: user.email,
      role: user.role,
      requestId: req.requestId
    });
    
    // 设置用户上下文
    logger.setUserContext(user.email);
    
    res.status(200).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        userStatus: user.userStatus,
        balance: user.balance
      }
    });
  } catch (error) {
    logger.error('登录处理失败', { 
      error: error.message, 
      stack: error.stack,
      requestId: req.requestId,
      email: req.body?.email
    });
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

// Get current user profile
router.get('/me', authenticate, async (req, res) => {
  try {
    logger.user('获取用户个人资料', { 
      userId: req.user.id,
      email: req.user.email,
      requestId: req.requestId
    });
    
    res.status(200).json({
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role,
        userStatus: req.user.userStatus,
        balance: req.user.balance,
        rechargeAmount: req.user.rechargeAmount,
        consumeAmount: req.user.consumeAmount,
        transferAmount: req.user.transferAmount
      }
    });
  } catch (error) {
    logger.error('获取用户资料失败', { 
      error: error.message, 
      stack: error.stack,
      userId: req.user?.id,
      userEmail: req.user?.email,
      requestId: req.requestId
    });
    res.status(500).json({ message: 'Failed to get user profile', error: error.message });
  }
});

// 为特定邮箱用户设置管理员权限
router.post('/set-admin', authenticate,  async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: '未提供有效的认证令牌' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.JWT_SECRET);
    
    // 检查用户邮箱是否为允许设置为管理员的邮箱
    const adminEmails = ['wingerliu2019@gmail.com']; // 可以设置为管理员的邮箱列表
    
    if (!adminEmails.includes(decoded.email)) {
      logger.auth('设置管理员失败: 用户邮箱不在白名单中', { 
        userId: decoded.id,
        email: decoded.email,
        requestId: req.requestId
      });
      return res.status(403).json({ message: '您的账号没有获得管理员权限的资格' });
    }
    
    logger.auth('用户请求设置为管理员', { 
      userId: decoded.id,
      email: decoded.email,
      requestId: req.requestId
    });
    
    // 更新用户角色为管理员
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      logger.auth('设置管理员失败 - 用户不存在', { 
        userId: decoded.id,
        requestId: req.requestId
      });
      return res.status(404).json({ message: '用户不存在' });
    }
    
    // 设置为管理员角色
    user.role = 'admin';
    await user.save();
    
    // 生成新的JWT令牌
    const newToken = jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        username: user.username,
        role: user.role
      },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );
    
    logger.auth('用户已设置为管理员', { 
      userId: user.id,
      email: user.email,
      username: user.username,
      requestId: req.requestId
    });
    
    return res.json({ 
      message: '已成功设置为管理员',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token: newToken
    });
  } catch (error) {
    logger.error('设置管理员失败:', { 
      error: error.message, 
      stack: error.stack,
      requestId: req.requestId
    });
    return res.status(500).json({ message: '服务器错误' });
  }
});

// 更新用户资料
router.put('/profile', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { username } = req.body;
    
    logger.user('用户请求更新个人资料', { 
      userId,
      email: req.user.email,
      requestId: req.requestId,
      updatedFields: { username }
    });
    
    // 获取当前用户
    const user = await User.findByPk(userId);
    
    if (!user) {
      logger.user('更新个人资料失败: 用户不存在', { 
        userId,
        requestId: req.requestId
      });
      return res.status(404).json({ message: '用户不存在' });
    }
    
    // 只允许更新用户名，不允许更新邮箱
    if (username) {
      user.username = username;
    }
    
    await user.save();
    
    logger.user('用户资料更新成功', { 
      userId: user.id,
      email: user.email,
      username: user.username,
      requestId: req.requestId
    });
    
    return res.json({
      message: '资料更新成功',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        userStatus: user.userStatus,
        balance: user.balance,
        rechargeAmount: user.rechargeAmount,
        consumeAmount: user.consumeAmount,
        transferAmount: user.transferAmount
      }
    });
  } catch (error) {
    logger.error('更新用户资料失败:', { 
      error: error.message, 
      stack: error.stack,
      userId: req.user?.id,
      requestId: req.requestId
    });
    return res.status(500).json({ message: '更新失败', error: error.message });
  }
});

module.exports = router; 