const logger = require('../utils/logger');

/**
 * 请求日志中间件 - 使用增强的logger系统
 * 主要功能：
 * 1. 为每个请求生成唯一ID
 * 2. 设置请求上下文包括用户信息
 * 3. 记录请求的完整生命周期
 * 4. 计算和记录响应时间
 */
const requestLogger = (req, res, next) => {
  // 直接使用增强logger系统的请求上下文初始化功能
  logger.initRequestContext(req, res, next);
};

module.exports = requestLogger; 