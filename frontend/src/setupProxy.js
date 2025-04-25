const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:8080',
      changeOrigin: true,
      pathRewrite: {'^/api': ''}, // 移除/api前缀
      onProxyReq: (proxyReq) => {
        proxyReq.setHeader('Origin', 'http://localhost:3000');
        proxyReq.setHeader('Access-Control-Request-Method', 'POST');
        proxyReq.setHeader('Access-Control-Request-Headers', 'Content-Type,Authorization');
      },
    })
  );
};