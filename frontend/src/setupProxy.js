const { createProxyMiddleware } = require('http-proxy-middleware');

// 获取API基础URL或使用默认值
const apiBaseUrl = process.env.VIDEO_FRONTEND_API_BASE_URL || 'http://localhost:6001';

module.exports = function(app) {
  app.use('/api', createProxyMiddleware({
    target: apiBaseUrl,
    changeOrigin: true,
    pathRewrite: {'^/api': '/api'},
    onProxyReq: (proxyReq) => {
      proxyReq.setHeader('Origin', 'http://localhost:3001');
      proxyReq.setHeader('Access-Control-Request-Method', 'POST');
      proxyReq.setHeader('Access-Control-Request-Headers', 'Content-Type,Authorization');
    },
  }));
};
