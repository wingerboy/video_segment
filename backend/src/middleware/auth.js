const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * 用户身份验证中间件
 */
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: '需要身份验证' 
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    let user;
    
    // 如果token中包含email，则通过email查找
    if (decoded.email) {
      user = await User.findByEmail(decoded.email);
    } else if (decoded.id) {
      // 向后兼容：如果token中包含id，则通过id查找
      user = await User.findByPk(decoded.id);
    } else {
      throw new Error('无效的Token');
    }
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: '用户不存在' 
      });
    }
    
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false,
      message: '身份验证失败' 
    });
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