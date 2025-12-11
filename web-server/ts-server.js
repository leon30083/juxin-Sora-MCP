const express = require('express');
const fetch = require('node-fetch');

const app = express();
const PORT = 3033;

// 中间件
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 配置
const apiKey = process.env.JUXIN_API_KEY || 'sk-Q6DwAtsNvutSlaZXYAzXR39pUmwKHAHDgll0QifCL5GbwJd7';
const baseUrl = 'https://api.jxincm.cn';

// Juxin API客户端
class JuxinApiClient {
  constructor(apiKey, baseUrl = 'https://api.jxincm.cn') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async createVideo(request) {
    const response = await fetch(`${this.baseUrl}/v1/video/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(`创建视频失败: ${errorMessage}`);
    }

    return await response.json();
  }

  async queryVideoStatus(request) {
    const url = new URL(`${this.baseUrl}/v1/video/query`);
    url.searchParams.append('id', request.id);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      }
    });

    if (!response.ok) {
      const errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(`查询视频状态失败: ${errorMessage}`);
    }

    return await response.json();
  }
}

const client = new JuxinApiClient(apiKey);

// API路由

// 1. 创建视频
app.post('/api/video/create', async (req, res) => {
  try {
    const response = await client.createVideo(req.body);

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

// 3. 聚鑫API测试
app.get('/api/test-juxin', async (req, res) => {
  try {
    const testResponse = await client.createVideo({
      model: 'sora-2',
      prompt: 'a cat walking under cherry blossoms',
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

// 4. 查询已知任务
app.get('/api/query/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const response = await client.queryVideoStatus({ id: taskId });

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
app.listen(PORT, () => {
  console.log(`\n🚀 Juxin API Web Server is running!`);
  console.log(`📱 Web Interface: http://localhost:${PORT}`);
  console.log('\nPress Ctrl+C to stop the server.\n');
});