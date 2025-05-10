const { createProxyMiddleware } = require('http-proxy-middleware');
const dotenv = require('dotenv');
const path = require('path');

// 加载环境变量文件
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// 获取API基础URL或使用默认值
const apiBaseUrl = process.env.REACT_APP_VIDEO_FRONTEND_API_BASE_URL || 'http://localhost:6001';

// 输出调试信息
console.log('[setupProxy] 配置代理到:', apiBaseUrl);
console.log('[setupProxy] 环境变量:', {
  REACT_APP_VIDEO_FRONTEND_API_BASE_URL: process.env.REACT_APP_VIDEO_FRONTEND_API_BASE_URL,
  REACT_APP_VIDEO_FRONTEND_API_URL: process.env.REACT_APP_VIDEO_FRONTEND_API_URL,
  NODE_ENV: process.env.NODE_ENV
});

module.exports = function(app) {
  console.log('[setupProxy] 初始化代理中...');
  app.use('/api', createProxyMiddleware({
    target: apiBaseUrl,
    changeOrigin: true,
    pathRewrite: {'^/api': '/api'},
    onProxyReq: (proxyReq) => {
      console.log(`[代理请求] ${proxyReq.method} ${proxyReq.path} => ${apiBaseUrl}`);
      proxyReq.setHeader('Origin', 'http://localhost:3001');
      proxyReq.setHeader('Access-Control-Request-Method', 'POST');
      proxyReq.setHeader('Access-Control-Request-Headers', 'Content-Type,Authorization');
    },
    logLevel: 'debug'
  }));
};
