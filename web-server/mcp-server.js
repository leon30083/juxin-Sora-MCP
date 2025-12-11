const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs').promises;
const cors = require('cors');
const { spawn } = require('child_process');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const PORT = 3033;

// MCP服务器路径
const MCP_SERVER_PATH = path.join(__dirname, '..', 'dist', 'index.js');

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// WebSocket连接管理
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('WebSocket client connected');
  ws.on('close', () => {
    clients.delete(ws);
    console.log('WebSocket client disconnected');
  });
});

// 广播函数
function broadcast(data) {
  const message = JSON.stringify(data);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// 调用MCP工具的辅助函数
async function callMCPTool(toolName, args) {
  return new Promise((resolve, reject) => {
    const mcpProcess = spawn('node', [MCP_SERVER_PATH], {
      stdio: 'pipe',
      env: {
        ...process.env,
        JUXIN_API_KEY: process.env.JUXIN_API_KEY || 'sk-Q6DwAtsNvutSlaZXYAzXR39pUmwKHAHDgll0QifCL5GbwJd7'
      }
    });

    let requestData = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args
      }
    };

    let response = '';
    let responseData = '';

    mcpProcess.stdout.on('data', (data) => {
      response += data.toString();

      // 尝试解析响应
      try {
        const lines = response.trim().split('\n');
        const lastLine = lines[lines.length - 1];
        if (lastLine.startsWith('data: ')) {
          responseData += lastLine.substring(6);
          const parsed = JSON.parse(responseData);
          resolve(parsed);
        }
      } catch (e) {
        // 还没有完整的响应，继续等待
      }
    });

    mcpProcess.stderr.on('data', (data) => {
      console.error('MCP Error:', data.toString());
    });

    mcpProcess.on('error', (error) => {
      reject(error);
    });

    mcpProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`MCP process exited with code ${code}`));
      } else if (!responseData) {
        reject(new Error('No response from MCP'));
      }
    });

    // 发送请求
    mcpProcess.stdin.write(JSON.stringify(requestData) + '\n');
  });
}

// 创建视频的简化版本（直接使用聚鑫API）
async function createVideoDirect(params) {
  const { JuxinApiClient } = require('../dist/juxin-client');

  const client = new JuxinApiClient(process.env.JUXIN_API_KEY || 'sk-Q6DwAtsNvutSlaZXYAzXR39pUmwKHAHDgll0QifCL5GbwJd7');

  const videoRequest = {
    model: 'sora-2',
    ...params
  };

  return await client.createVideo(videoRequest);
}

// 查询任务状态
async function queryVideoStatus(taskId) {
  const { JuxinApiClient } = require('../dist/juxin-client');

  const client = new JuxinApiClient(process.env.JUXIN_API_KEY || 'sk-Q6DwAtsNvutSlaZXYAzXR39pUmwKHAHDgll0QifCL5GbwJd7');

  return await client.queryVideoStatus({ id: taskId });
}

// API路由

// 1. 创建视频
app.post('/api/video/create', async (req, res) => {
  try {
    const response = await createVideoDirect(req.body);

    // 广播新任务
    broadcast({
      type: 'task_created',
      data: {
        id: response.id,
        status: response.status,
        prompt: req.body.prompt,
        created_at: Date.now()
      }
    });

    res.json({
      success: true,
      task_id: response.id,
      status: response.status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 2. 查询任务状态
app.get('/api/video/status/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const response = await queryVideoStatus(taskId);

    // 广播状态更新
    broadcast({
      type: 'task_updated',
      data: {
        id: taskId,
        status: response.status,
        data: response
      }
    });

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 3. 测试API
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Web服务器运行正常',
    mcpPath: MCP_SERVER_PATH
  });
});

// 4. 聚鑫API测试
app.get('/api/test-juxin', async (req, res) => {
  try {
    const { JuxinApiClient } = require('../dist/juxin-client');
    const client = new JuxinApiClient(process.env.JUXIN_API_KEY || 'sk-Q6DwAtsNvutSlaZXYAzXR39pUmwKHAHDgll0QifCL5GbwJd7');

    // 测试创建一个简单任务
    const testResponse = await client.createVideo({
      model: 'sora-2',
      prompt: 'a cat walking',
      orientation: 'landscape',
      size: 'small',
      duration: 15,
      watermark: false,
      private: true,
      images: []
    });

    res.json({
      success: true,
      testResponse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 5. 查询任务（用于测试已知任务ID）
app.get('/api/query/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const response = await queryVideoStatus(taskId);

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 启动服务器
server.listen(PORT, () => {
  console.log(`\n🚀 Juxin MCP Web Server is running!`);
  console.log(`📱 Web Interface: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
  console.log(`📡 MCP Server: ${MCP_SERVER_PATH}`);
  console.log('\nPress Ctrl+C to stop the server.\n');
});