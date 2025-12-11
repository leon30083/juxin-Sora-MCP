const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3033;

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, '..')));

// API路由 - 模拟响应
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Web服务器运行正常'
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`\n🚀 Web服务器已启动！`);
  console.log(`📱 网址: http://localhost:${PORT}`);
  console.log(`\n现在您可以使用Chrome DevTools MCP工具打开此页面进行测试`);
  console.log('=======================================\n');
});