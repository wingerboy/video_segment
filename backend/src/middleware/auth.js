const jwt = require('jsonwebtoken');
const { User } = require('../models');
const config = require('../config');

/**
 * 用户身份验证中间件
 */
const authenticate = async (req, res, next) => {
  try {
    // 获取请求头中的Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: '认证失败: 缺少Token' });
    }
    
    // 提取Token
    const token = authHeader.split(' ')[1];
    
    // 验证Token
    const decoded = jwt.verify(token, config.JWT_SECRET);
    
    // 检查用户是否存在
    const user = await User.findOne({ where: { id: decoded.id } });
    
    if (!user) {
      return res.status(401).json({ message: '认证失败: 用户不存在' });
    }
    
    // 将用户信息添加到请求对象中
    req.user = user;
    
    // 继续下一步
    next();
  } catch (error) {
    console.error('认证失败:', error);
    
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
    return res.status(401).json({ 
      success: false,
      message: '需要先进行身份验证' 
    });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false,
      message: '需要管理员权限' 
    });
  }
  
  next();
};

/**
 * 代理商权限验证中间件
 */
const isAgent = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false,
      message: '需要先进行身份验证' 
    });
  }
  
  if (req.user.role !== 'agent' && req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false,
      message: '需要代理商或管理员权限' 
    });
  }
  
  next();
};

module.exports = {
  authenticate,
  isAdmin,
  isAgent
}; 