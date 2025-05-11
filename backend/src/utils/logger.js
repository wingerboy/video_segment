const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');
const { createNamespace, getNamespace } = require('cls-hooked');

// 创建命名空间用于存储当前请求的上下文信息
const SESSION_NAMESPACE = 'video-segment-api-session';
const session = createNamespace(SESSION_NAMESPACE);

// 确保日志目录存在
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 创建用户日志目录（按用户分类日志）
const userLogDir = path.join(logDir, 'users');
if (!fs.existsSync(userLogDir)) {
  fs.mkdirSync(userLogDir, { recursive: true });
}

// 自定义日志格式
const logFormat = winston.format.printf(({ level, message, timestamp, ...metadata }) => {
  // 获取会话上下文中的用户信息和其他元数据
  const sessionId = metadata.sessionId || 'unknown';
  const userEmail = metadata.userEmail || metadata.email || 'anonymous';
  const requestId = metadata.requestId || 'unknown';
  const userAgent = metadata.userAgent || 'unknown';
  const ip = metadata.ip || 'unknown';
  
  // 基本日志信息
  let msg = `${timestamp} [${level}] [${sessionId}] [${userEmail}]: ${message}`;
  
  // 移除已处理的元数据字段，只保留额外信息
  const cleanMetadata = { ...metadata };
  ['sessionId', 'userEmail', 'email', 'requestId', 'userAgent', 'ip'].forEach(key => {
    delete cleanMetadata[key];
  });
  
  // 添加剩余的元数据（如错误详情、操作参数等）
  if (Object.keys(cleanMetadata).length > 0) {
    msg += ` ${JSON.stringify(cleanMetadata)}`;
  }
  
  return msg;
});

// 创建winston日志记录器
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    logFormat
  ),
  defaultMeta: { service: 'video-segment-api' },
  transports: [
    // 控制台输出
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      ),
    }),
    
    // 普通日志文件 - 每天轮转
    new winston.transports.DailyRotateFile({
      filename: path.join(logDir, 'application-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      level: 'info'
    }),
    
    // 错误日志单独存储
    new winston.transports.DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      level: 'error'
    }),
    
    // API请求日志
    new winston.transports.DailyRotateFile({
      filename: path.join(logDir, 'api-requests-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      level: 'info'
    }),
    
    // 任务处理日志
    new winston.transports.DailyRotateFile({
      filename: path.join(logDir, 'tasks-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m', 
      maxFiles: '14d',
      level: 'info'
    })
  ]
});

// 增强日志对象，添加上下文信息获取功能
const enhancedLogger = {
  // 通用日志方法，自动添加上下文信息
  log: (level, message, metadata = {}) => {
    const contextData = {};
    
    // 从当前CLS命名空间获取上下文
    if (session && session.active) {
      try {
        const ns = getNamespace(SESSION_NAMESPACE);
        if (ns) {
          const sessionId = ns.get('sessionId');
          const userEmail = ns.get('userEmail');
          const requestId = ns.get('requestId');
          const userAgent = ns.get('userAgent');
          const ip = ns.get('ip');
          
          if (sessionId) contextData.sessionId = sessionId;
          if (userEmail) contextData.userEmail = userEmail;
          if (requestId) contextData.requestId = requestId;
          if (userAgent) contextData.userAgent = userAgent;
          if (ip) contextData.ip = ip;
        }
      } catch (err) {
        // 忽略获取上下文的错误
      }
    }
    
    // 合并上下文数据和传入的元数据
    const combinedMetadata = { ...contextData, ...metadata };
    logger[level](message, combinedMetadata);
    
    // 如果有用户邮箱，记录到用户特定的日志文件中
    if (combinedMetadata.userEmail && combinedMetadata.userEmail !== 'anonymous') {
      const sanitizedEmail = combinedMetadata.userEmail.replace(/[^a-zA-Z0-9]/g, '_');
      const userLogger = winston.createLogger({
        level: 'info',
        format: winston.format.combine(
          winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
          winston.format.errors({ stack: true }),
          winston.format.splat(),
          logFormat
        ),
        transports: [
          new winston.transports.File({
            filename: path.join(userLogDir, `${sanitizedEmail}.log`),
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 5
          })
        ]
      });
      
      userLogger[level](message, combinedMetadata);
    }
  },
  
  // 标准日志级别接口
  error: (message, metadata = {}) => enhancedLogger.log('error', message, metadata),
  warn: (message, metadata = {}) => enhancedLogger.log('warn', message, metadata),
  info: (message, metadata = {}) => enhancedLogger.log('info', message, metadata),
  debug: (message, metadata = {}) => enhancedLogger.log('debug', message, metadata),
  
  // 特定业务领域的日志函数
  user: (message, metadata = {}) => {
    enhancedLogger.log('info', `[USER] ${message}`, { ...metadata, domain: 'user' });
  },
  
  auth: (message, metadata = {}) => {
    enhancedLogger.log('info', `[AUTH] ${message}`, { ...metadata, domain: 'auth' });
  },
  
  task: (message, metadata = {}) => {
    enhancedLogger.log('info', `[TASK] ${message}`, { ...metadata, domain: 'task' });
  },
  
  api: (message, metadata = {}) => {
    enhancedLogger.log('info', `[API] ${message}`, { ...metadata, domain: 'api' });
  },
  
  // 初始化请求上下文
  initRequestContext: (req, res, next) => {
    // 在CLS命名空间中创建请求上下文
    session.run(() => {
      // 生成唯一会话ID
      const sessionId = req.sessionID || `ses_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      session.set('sessionId', sessionId);
      
      // 设置请求ID
      const requestId = req.headers['x-request-id'] || 
                        req.headers['x-correlation-id'] || 
                        `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      session.set('requestId', requestId);
      req.requestId = requestId; // 在请求对象上也设置请求ID
      
      // 设置IP和用户代理
      const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];
      session.set('ip', ip);
      session.set('userAgent', userAgent);
      
      // 当用户身份验证完成后设置用户邮箱
      if (req.user && req.user.email) {
        session.set('userEmail', req.user.email);
      }
      
      // 记录API请求
      const method = req.method;
      const url = req.originalUrl || req.url;
      const logData = {
        method,
        url,
        ip,
        userAgent,
        requestId,
        sessionId,
        userEmail: req.user ? req.user.email : 'anonymous',
        params: req.params,
        query: req.query
      };
      
      // 不记录敏感信息如密码
      if (req.body && Object.keys(req.body).length > 0) {
        const bodyCopy = { ...req.body };
        if (bodyCopy.password) bodyCopy.password = '[REDACTED]';
        if (bodyCopy.token) bodyCopy.token = '[REDACTED]';
        logData.body = bodyCopy;
      }
      
      enhancedLogger.api(`Received ${method} request to ${url}`, logData);
      
      // 拦截响应完成事件以记录响应
      const originalEnd = res.end;
      res.end = function(chunk, encoding) {
        res.end = originalEnd;
        res.end(chunk, encoding);
        
        // 记录响应状态
        enhancedLogger.api(`Response sent for ${method} ${url}`, {
          method,
          url,
          statusCode: res.statusCode,
          responseTime: Date.now() - req._startTime,
          requestId,
          sessionId,
          userEmail: req.user ? req.user.email : 'anonymous'
        });
      };
      
      // 保存请求开始时间，用于计算响应时间
      req._startTime = Date.now();
      
      next();
    });
  },
  
  // 设置用户上下文（在用户登录后调用）
  setUserContext: (userEmail) => {
    if (session && session.active) {
      try {
        session.set('userEmail', userEmail);
      } catch (err) {
        // 忽略设置上下文的错误
      }
    }
  }
};

// 在开发环境下添加更详细的调试信息
if (process.env.NODE_ENV !== 'production') {
  enhancedLogger.debug('日志系统初始化完成，当前环境:', { environment: process.env.NODE_ENV || 'development' });
}

module.exports = enhancedLogger; 