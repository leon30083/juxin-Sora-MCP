require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;

// Import our API client
const { JuxinAPIClient } = require('./api-client');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const PORT = process.env.PORT || 3033;

// Initialize API client
const apiKey = process.env.JUXIN_API_KEY || 'sk-Q6DwAtsNvutSlaZXYAzXR39pUmwKHAHDgll0QifCL5GbwJd7';
const apiClient = new JuxinAPIClient(apiKey);

// Initialize client
apiClient.init().then(() => {
  console.log('API Client initialized');
}).catch(console.error);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configure file upload
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// WebSocket connection management
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('New WebSocket client connected');

  // Send initial data
  sendToClient(ws, {
    type: 'init',
    data: {
      tasks: apiClient.getAllTasks()
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log('WebSocket client disconnected');
  });

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      await handleWebSocketMessage(ws, data);
    } catch (err) {
      console.error('WebSocket message error:', err);
    }
  });
});

// Broadcast to all clients
function broadcast(message) {
  const data = JSON.stringify(message);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  }
}

// Send to specific client
function sendToClient(ws, message) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

// Handle WebSocket messages
async function handleWebSocketMessage(ws, message) {
  const { type, data } = message;

  switch (type) {
    case 'subscribeToTask':
      // Subscribe to task updates
      ws.subscribedTask = data.taskId;
      break;

    case 'unsubscribeFromTask':
      ws.subscribedTask = null;
      break;
  }
}

// API Client event handlers
apiClient.on('taskCreated', (data) => {
  broadcast({
    type: 'taskCreated',
    data
  });
});

apiClient.on('taskUpdated', (data) => {
  broadcast({
    type: 'taskUpdated',
    data
  });

  // Send specific updates to subscribed clients
  for (const client of clients) {
    if (client.subscribedTask === data.taskId) {
      sendToClient(client, {
        type: 'taskProgress',
        data
      });
    }
  }
});

apiClient.on('progress', (data) => {
  broadcast({
    type: 'progress',
    data
  });

  // Send specific progress to subscribed clients
  for (const client of clients) {
    if (client.subscribedTask === data.taskId) {
      sendToClient(client, {
        type: 'detailedProgress',
        data
      });
    }
  }
});

apiClient.on('completed', (data) => {
  broadcast({
    type: 'completed',
    data
  });
});

apiClient.on('failed', (data) => {
  broadcast({
    type: 'failed',
    data
  });
});

// REST API Routes

// Create video generation task
app.post('/api/video/create', async (req, res) => {
  try {
    const result = await apiClient.createVideo(req.body);
    res.json(result);
  } catch (err) {
    console.error('Create video error:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// Create character generation task
app.post('/api/character/create', async (req, res) => {
  try {
    const result = await apiClient.createCharacter(req.body);
    res.json(result);
  } catch (err) {
    console.error('Create character error:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// Query video status
app.get('/api/video/status/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const status = await apiClient.queryVideoStatus(taskId);
    res.json({
      success: true,
      data: status
    });
  } catch (err) {
    console.error('Query video status error:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// Generate video with automatic progress following
app.post('/api/video/generate-and-follow', async (req, res) => {
  try {
    const result = await apiClient.generateAndFollow(req.body);
    res.json(result);
  } catch (err) {
    console.error('Generate and follow error:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// Query all tasks
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await apiClient.queryAllVideos();
    res.json({
      success: true,
      data: tasks
    });
  } catch (err) {
    console.error('Query all tasks error:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// Get specific task
app.get('/api/tasks/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = apiClient.getTask(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }
    res.json({
      success: true,
      data: task
    });
  } catch (err) {
    console.error('Get task error:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// Upload image endpoint
app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    // For now, return file info
    // In production, you would upload to a cloud storage
    const imageUrl = `/uploads/${req.file.filename}`;

    res.json({
      success: true,
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        url: imageUrl
      }
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      activeConnections: clients.size
    }
  });
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Start server
server.listen(PORT, () => {
  console.log(`\n🚀 Juxin MCP Web Server is running on http://localhost:${PORT}`);
  console.log(`\n📡 WebSocket server ready for real-time updates`);
  console.log(`\n📋 Available API endpoints:`);
  console.log(`  POST /api/video/create - Create video generation task`);
  console.log(`  POST /api/character/create - Create character generation task`);
  console.log(`  GET  /api/video/status/:taskId - Query video status`);
  console.log(`  POST /api/video/generate-and-follow - Generate with progress tracking`);
  console.log(`  GET  /api/tasks - Get all tasks`);
  console.log(`  GET  /api/tasks/:taskId - Get specific task`);
  console.log(`  POST /api/upload - Upload image file`);
  console.log(`  GET  /api/health - Health check\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\nShutting down server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});