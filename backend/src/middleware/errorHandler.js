const logger = require('../utils/logger');

/**
 * 全局错误处理中间件
 * - 记录所有未捕获的异常
 * - 为前端提供标准化的错误响应
 * - 根据环境提供不同级别的错误详情
 */
const errorHandler = (err, req, res, next) => {
  // 提取关键错误信息
  const statusCode = err.statusCode || 500;
  const errorCode = err.code || 'INTERNAL_SERVER_ERROR';
  const message = err.message || '服务器内部错误';
  
  // 构建日志信息
  const logData = {
    statusCode,
    errorCode,
    errorMessage: message,
    stack: err.stack,
    requestId: req.requestId,
    path: req.path,
    method: req.method,
    userEmail: req.user ? req.user.email : 'anonymous',
    userId: req.user ? req.user.id : null,
    query: req.query,
    params: req.params
  };
  
  // 如果是4xx错误，作为警告记录；如果是5xx错误，作为错误记录
  if (statusCode >= 500) {
    logger.error(`服务器错误: ${message}`, logData);
  } else {
    logger.warn(`客户端错误: ${message}`, logData);
  }
  
  // 根据环境决定响应中包含的错误信息
  const isProd = process.env.NODE_ENV === 'production';
  const errorResponse = {
    success: false,
    error: {
      message,
      code: errorCode,
      ...(isProd ? {} : { stack: err.stack })
    }
  };
  
  res.status(statusCode).json(errorResponse);
};

/**
 * 捕获未处理的Promise异常
 */
const setupUnhandledRejectionHandler = () => {
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('未处理的Promise异常:', {
      reason: reason instanceof Error ? reason.message : reason,
      stack: reason instanceof Error ? reason.stack : null
    });
  });
};

/**
 * 捕获未处理的异常
 */
const setupUncaughtExceptionHandler = () => {
  process.on('uncaughtException', (error) => {
    logger.error('未捕获的异常:', {
      error: error.message,
      stack: error.stack
    });
    
    // 给进程一点时间来记录日志后退出
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });
};

// 初始化全局异常处理器
setupUnhandledRejectionHandler();
setupUncaughtExceptionHandler();

module.exports = errorHandler; 