// Direct API Client - Alternative approach without MCP protocol
const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');

class JuxinAPIClient extends EventEmitter {
  constructor(apiKey, baseUrl = 'https://api.jxincm.cn') {
    super();
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.tasks = new Map();
    this.taskFilePath = path.join(__dirname, '..', 'tasks.json');
  }

  async init() {
    // Load existing tasks
    try {
      const data = await fs.readFile(this.taskFilePath, 'utf8');
      const tasks = JSON.parse(data);
      for (const [id, task] of Object.entries(tasks)) {
        this.tasks.set(id, task);
      }
      console.log(`Loaded ${this.tasks.size} tasks`);
    } catch (err) {
      console.log('No existing tasks found');
    }
  }

  async saveTasks() {
    const tasksObj = {};
    for (const [id, task] of this.tasks.entries()) {
      tasksObj[id] = task;
    }
    await fs.writeFile(this.taskFilePath, JSON.stringify(tasksObj, null, 2));
  }

  async createVideo(params) {
    const {
      prompt,
      orientation = 'landscape',
      size = 'small',
      duration = 10,
      watermark = false,
      private = true,
      images = []
    } = params;

    const response = await fetch(`${this.baseUrl}/v1/video/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sora-2',
        prompt,
        orientation,
        size,
        duration,
        watermark,
        private,
        images
      })
    });

    const data = await response.json();

    if (data.code === 200) {
      const taskId = data.data.task_id;

      // Store task
      this.tasks.set(taskId, {
        id: taskId,
        type: 'video',
        status: 'pending',
        params,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      await this.saveTasks();
      this.emit('taskCreated', { taskId, type: 'video' });

      return {
        success: true,
        taskId,
        message: 'Video generation task created successfully'
      };
    } else {
      throw new Error(data.message || 'Failed to create video task');
    }
  }

  async createCharacter(params) {
    const { prompt, style = 'realistic' } = params;

    const response = await fetch(`${this.baseUrl}/v1/character/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'character-v2',
        prompt,
        style
      })
    });

    const data = await response.json();

    if (data.code === 200) {
      const taskId = data.data.task_id;

      // Store task
      this.tasks.set(taskId, {
        id: taskId,
        type: 'character',
        status: 'pending',
        params,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      await this.saveTasks();
      this.emit('taskCreated', { taskId, type: 'character' });

      return {
        success: true,
        taskId,
        message: 'Character creation task created successfully'
      };
    } else {
      throw new Error(data.message || 'Failed to create character task');
    }
  }

  async queryVideoStatus(taskId) {
    const response = await fetch(`${this.baseUrl}/v1/video/query?task_id=${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });

    const data = await response.json();

    if (data.code === 200) {
      const videoData = data.data;
      const task = this.tasks.get(taskId);

      if (task) {
        task.status = videoData.status;
        task.progress = videoData.progress || 0;
        task.result = videoData;
        task.updatedAt = new Date().toISOString();

        this.tasks.set(taskId, task);
        await this.saveTasks();

        this.emit('taskUpdated', { taskId, task });
      }

      return videoData;
    } else {
      throw new Error(data.message || 'Failed to query video status');
    }
  }

  async queryAllVideos() {
    const results = [];
    for (const [taskId, task] of this.tasks.entries()) {
      try {
        const status = await this.queryVideoStatus(taskId);
        results.push({
          taskId,
          type: task.type,
          status: status.status,
          progress: status.progress || 0,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt
        });
      } catch (err) {
        results.push({
          taskId,
          type: task.type,
          status: 'error',
          error: err.message,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt
        });
      }
    }
    return results;
  }

  async generateAndFollow(params) {
    const task = await this.createVideo(params);

    // Start polling
    const pollInterval = setInterval(async () => {
      try {
        const status = await this.queryVideoStatus(task.taskId);

        this.emit('progress', {
          taskId: task.taskId,
          status: status.status,
          progress: status.progress || 0
        });

        if (status.status === 'completed' || status.status === 'failed') {
          clearInterval(pollInterval);

          if (status.status === 'completed') {
            this.emit('completed', {
              taskId: task.taskId,
              videoUrl: status.video_url
            });
          } else {
            this.emit('failed', {
              taskId: task.taskId,
              error: status.error || 'Generation failed'
            });
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 2000); // Poll every 2 seconds

    return task;
  }

  getTask(taskId) {
    return this.tasks.get(taskId);
  }

  getAllTasks() {
    return Array.from(this.tasks.values()).sort((a, b) =>
      new Date(b.createdAt) - new Date(a.createdAt)
    );
  }
}

module.exports = { JuxinAPIClient };