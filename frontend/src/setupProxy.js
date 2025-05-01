const { createProxyMiddleware } = require('http-proxy-middleware');
module.exports = function(app) {
  app.use('/api', createProxyMiddleware({
    target: 'http://localhost:6001',
    changeOrigin: true,
    pathRewrite: {'^/api': '/api'},
    onProxyReq: (proxyReq) => {
      proxyReq.setHeader('Origin', 'http://localhost:3001');
      proxyReq.setHeader('Access-Control-Request-Method', 'POST');
      proxyReq.setHeader('Access-Control-Request-Headers', 'Content-Type,Authorization');
    },
  }));
};
