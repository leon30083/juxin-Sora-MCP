require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;

// 导入MCP服务器的模块
const { JuxinApiClient } = require('../dist/src/juxin-client');
const { TaskManager } = require('../dist/src/task-manager');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const PORT = process.env.PORT || 3033;

// 配置
const apiKey = process.env.JUXIN_API_KEY || 'sk-Q6DwAtsNvutSlaZXYAzXR39pUmwKHAHDgll0QifCL5GbwJd7';
const client = new JuxinApiClient(apiKey);
const taskManager = new TaskManager('../tasks.json');

// 初始化任务管理器
taskManager.init().catch(console.error);

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 配置文件上传
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// WebSocket连接管理
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('New WebSocket client connected');

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

// API路由

// 1. 创建视频
app.post('/api/video/create', async (req, res) => {
  try {
    const {
      prompt,
      orientation = 'landscape',
      size = 'small',
      duration = 15,
      watermark = false,
      private = true,
      images = []
    } = req.body;

    // 处理图片上传
    let imageUrls = images;
    if (req.files && req.files.images) {
      imageUrls = await Promise.all(
        req.files.images.map(async (file) => {
          // 这里应该上传到图床，暂时使用本地路径
          return `/uploads/${file.filename}`;
        })
      );
    }

    const videoRequest = {
      prompt,
      model: 'sora-2',
      orientation,
      size,
      duration,
      watermark,
      private,
      images: imageUrls
    };

    const response = await client.createVideo(videoRequest);

    // 自动记录任务
    await taskManager.createTask(response.id, prompt, videoRequest);

    // 广播新任务
    broadcast({
      type: 'task_created',
      data: {
        id: response.id,
        prompt,
        status: response.status,
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
    const response = await client.queryVideoStatus({ id: taskId });

    // 更新任务状态
    if (response.status === 'completed') {
      await taskManager.updateTask(taskId, 'completed', {
        video_url: response.video_url,
        thumbnail_url: response.thumbnail_url,
        completed_at: Date.now()
      });
    } else if (response.status === 'failed') {
      await taskManager.updateTask(taskId, 'failed', {
        error: response.error,
        completed_at: Date.now()
      });
    }

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

// 3. 获取所有任务
app.get('/api/tasks', async (req, res) => {
  try {
    const { limit = 20, status = 'all' } = req.query;
    const allTasks = await taskManager.getAllTasks();

    let filteredTasks = allTasks;
    if (status !== 'all') {
      filteredTasks = allTasks.filter(t => t.status === status);
    }

    const tasks = filteredTasks.slice(0, parseInt(limit));

    res.json({
      success: true,
      tasks,
      total: filteredTasks.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 4. 获取任务统计
app.get('/api/tasks/stats', async (req, res) => {
  try {
    const stats = await taskManager.getStats();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 5. 批量查询任务
app.post('/api/tasks/batch', async (req, res) => {
  try {
    const { task_ids } = req.body;

    const results = await Promise.allSettled(
      task_ids.map(async (taskId) => {
        try {
          const response = await client.queryVideoStatus({ id: taskId });
          return { id: taskId, status: response.status, data: response };
        } catch (error) {
          return { id: taskId, status: 'error', error: String(error) };
        }
      })
    );

    const response = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          id: task_ids[index],
          status: 'error',
          error: result.reason
        };
      }
    });

    res.json({
      success: true,
      results,
      total: response.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 6. 创建角色
app.post('/api/character/create', async (req, res) => {
  try {
    const { url, timestamps } = req.body;

    const characterResponse = await fetch('https://api.jxincm.cn/sora/v1/characters', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ url, timestamps })
    });

    const character = await characterResponse.json();

    if (!characterResponse.ok) {
      throw new Error(character.error?.message || '创建角色失败');
    }

    res.json({
      success: true,
      character
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 7. 图片上传
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No file uploaded'
    });
  }

  res.json({
    success: true,
    filename: req.file.filename,
    path: `/uploads/${req.file.filename}`
  });
});

// 定时任务：更新所有进行中的任务
setInterval(async () => {
  try {
    const pendingTasks = await taskManager.getPendingTasks();

    if (pendingTasks.length > 0) {
      const updates = await Promise.allSettled(
        pendingTasks.map(async (task) => {
          try {
            const status = await client.queryVideoStatus({ id: task.id });
            return { taskId: task.id, status, data: status };
          } catch (error) {
            return { taskId: task.id, status: 'error', error: String(error) };
          }
        })
      );

      updates.forEach((update, index) => {
        if (update.status === 'fulfilled') {
          const { taskId, status, data } = update.value;

          // 广播状态更新
          broadcast({
            type: 'task_updated',
            data: {
              id: taskId,
              status,
              data
            }
          });

          // 更新数据库
          if (status === 'completed') {
            taskManager.updateTask(taskId, 'completed', {
              video_url: data.video_url,
              thumbnail_url: data.thumbnail_url,
              completed_at: Date.now()
            });
          } else if (status === 'failed') {
            taskManager.updateTask(taskId, 'failed', {
              error: data.error,
              completed_at: Date.now()
            });
          }
        }
      });
    }
  } catch (error) {
    console.error('Auto-update error:', error);
  }
}, 10000); // 每10秒更新一次

// 启动服务器
server.listen(PORT, () => {
  console.log(`\n🚀 Juxin MCP Web Server is running!`);
  console.log(`📱 Web Interface: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
  console.log('\nPress Ctrl+C to stop the server.\n');
});