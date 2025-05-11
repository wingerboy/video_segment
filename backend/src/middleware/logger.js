const logger = require('../utils/logger');

/**
 * 日志中间件 - 为每个请求设置日志上下文
 * 
 * 这个中间件负责：
 * 1. 初始化请求上下文，生成唯一请求ID
 * 2. 记录所有请求的基本信息
 * 3. 设置用户信息（如果已认证）
 * 4. 记录请求完成情况和响应时间
 */
const loggerMiddleware = (req, res, next) => {
  // 使用logger的请求上下文初始化功能
  logger.initRequestContext(req, res, next);
};

/**
 * 设置用户上下文的辅助函数
 * 在用户登录成功后调用
 */
const setUserContext = (userEmail) => {
  logger.setUserContext(userEmail);
};

module.exports = {
  loggerMiddleware,
  setUserContext
}; 