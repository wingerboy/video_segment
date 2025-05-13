const jwt = require('jsonwebtoken');
const { User } = require('../models');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * 用户身份验证中间件
 */
const authenticate = async (req, res, next) => {
  try {
    // 获取请求头中的Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.auth('认证失败: 缺少Token', { 
        requestId: req.requestId,
        path: req.path
      });
      return res.status(401).json({ message: '认证失败: 缺少Token' });
    }
    
    // 提取Token
    const token = authHeader.split(' ')[1];
    
    // 验证Token
    const decoded = jwt.verify(token, config.JWT_SECRET);
    
    // 检查用户是否存在
    const user = await User.findOne({ where: { id: decoded.id } });
    
    if (!user) {
      logger.auth('认证失败: 用户不存在', { 
        requestId: req.requestId,
        userId: decoded.id,
        userEmail: decoded.email
      });
      return res.status(401).json({ message: '认证失败: 用户不存在' });
    }
    
    // 检查用户状态是否为禁用
    if (user.userStatus === 'banned') {
      logger.auth('认证失败: 用户已禁用', { 
        requestId: req.requestId,
        userId: user.id,
        userEmail: user.email
      });
      return res.status(403).json({ 
        message: '用户已被禁用',
        code: 'USER_BANNED'  // 添加特殊状态码方便前端识别
      });
    }
    
    // 将用户信息添加到请求对象中
    req.user = user;
    
    // 在日志上下文中设置用户信息
    logger.setUserContext(user.email);
    
    // 记录成功的认证
    logger.auth('用户认证成功', {
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      path: req.path
    });
    
    // 继续下一步
    next();
  } catch (error) {
    logger.error('认证失败:', { 
      requestId: req.requestId,
      error: error.message, 
      errorName: error.name,
      stack: error.stack,
      path: req.path
    });
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: '认证失败: Token已过期' });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: '认证失败: 无效的Token' });
    }
    
    res.status(401).json({ message: '认证失败', error: error.message });
  }
};

/**
 * 管理员权限验证中间件
 */
const isAdmin = (req, res, next) => {
  if (!req.user) {
    logger.auth('权限检查失败: 未认证用户', { requestId: req.requestId });
    return res.status(401).json({ 
      success: false,
      message: '需要先进行身份验证' 
    });
  }
  
  if (req.user.role !== 'admin') {
    logger.auth('权限不足: 需要管理员权限', {
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role,
      path: req.path
    });
    return res.status(403).json({ 
      success: false,
      message: '需要管理员权限' 
    });
  }
  
  logger.auth('管理员权限验证通过', {
    userId: req.user.id,
    userEmail: req.user.email,
    path: req.path
  });
  
  next();
};

/**
 * 代理商权限验证中间件
 */
const isAgent = (req, res, next) => {
  if (!req.user) {
    logger.auth('权限检查失败: 未认证用户', { requestId: req.requestId });
    return res.status(401).json({ 
      success: false,
      message: '需要先进行身份验证' 
    });
  }
  
  if (req.user.role !== 'agent' && req.user.role !== 'admin') {
    logger.auth('权限不足: 需要代理商或管理员权限', {
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role,
      path: req.path
    });
    return res.status(403).json({ 
      success: false,
      message: '需要代理商或管理员权限' 
    });
  }
  
  logger.auth('代理商权限验证通过', {
    userId: req.user.id,
    userEmail: req.user.email,
    userRole: req.user.role,
    path: req.path
  });
  
  next();
};

module.exports = {
  authenticate,
  isAdmin,
  isAgent
}; 