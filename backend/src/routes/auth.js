const express = require('express');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { authenticate } = require('../middleware/auth');
const { Op } = require('sequelize');
const config = require('../config');

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
    
    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { username }]
      }
    });
    
    if (existingUser) {
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
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check if user is banned
    if (user.userStatus === 'banned') {
      return res.status(403).json({ message: 'Your account has been banned' });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign({ id: user.id, email: user.email }, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRES_IN
    });
    
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
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

// Get current user profile
router.get('/me', authenticate, async (req, res) => {
  try {
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
    res.status(500).json({ message: 'Failed to get user profile', error: error.message });
  }
});

// 开发环境下设置当前用户为管理员
router.post('/dev/set-admin', async (req, res) => {
  // 仅在开发环境下启用此路由
  if (process.env.NODE_ENV !== 'development') {
    return res.status(404).json({ message: '该接口只在开发环境下可用' });
  }

  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: '未提供有效的认证令牌' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // 更新用户角色为管理员
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
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
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
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
    console.error('设置管理员失败:', error);
    return res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router; 