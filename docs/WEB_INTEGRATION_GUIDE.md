# Web Integration Guide for Juxin MCP Server

## Overview

This guide provides a comprehensive solution for integrating MCP (Model Context Protocol) tools into a web interface. The solution uses a direct API client approach for better reliability and performance.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Web Frontend  │────▶│  Web Server     │────▶│  Juxin API      │
│   (Browser UI)  │◀────│   (Express.js)  │◀────│  (REST API)     │
│                 │     │                 │     │                 │
│ - React/Vue.js  │     │ - REST API      │     │ - Video Gen     │
│ - WebSocket     │     │ - WebSocket     │     │ - Character Gen │
│ - File Upload   │     │ - Task Manager  │     │ - Status API    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Implementation Approach

### 1. Direct API Client (Recommended)

Instead of using the MCP protocol directly, we created a direct API client that:
- Communicates directly with Juxin's REST API
- Manages tasks locally using a JSON file
- Provides WebSocket support for real-time updates
- Simplifies the web integration

**Advantages:**
- More reliable and faster
- Easier to debug and maintain
- Direct control over error handling
- Better performance for web applications

### 2. MCP Wrapper Service (Alternative)

We also created an MCP wrapper service that:
- Spawns MCP server as a child process
- Communicates via stdio using JSON-RPC
- Provides a bridge between web requests and MCP tools

**Advantages:**
- Keeps MCP protocol compatibility
- Can work with any MCP server
- Centralized tool management

## File Structure

```
juxin-mcp/
├── src/                          # MCP server source
│   ├── index.ts                  # Main MCP server
│   ├── juxin-client.ts           # Juxin API client
│   ├── task-manager.ts           # Task management
│   └── ...
├── web-server/
│   ├── server-v2.js              # Enhanced web server
│   ├── api-client.js             # Direct API client
│   ├── mcp-wrapper.js            # MCP wrapper (alternative)
│   ├── public-v2/                # Enhanced frontend
│   │   ├── index.html
│   │   ├── style.css
│   │   └── app.js
│   ├── uploads/                  # File upload directory
│   └── package-v2.json           # Updated dependencies
└── docs/
    └── WEB_INTEGRATION_GUIDE.md  # This guide
```

## Quick Start

### 1. Install Dependencies

```bash
# Install MCP server dependencies
cd E:\User\GitHub\Juxin_mcp
npm install

# Install web server dependencies
cd web-server
npm install
```

### 2. Build MCP Server

```bash
# From project root
npm run build
```

### 3. Set Environment Variables

Create `.env` file in `web-server` directory:

```
JUXIN_API_KEY=sk-Q6DwAtsNvutSlaZXYAzXR39pUmwKHAHDgll0QifCL5GbwJd7
PORT=3033
```

### 4. Start Web Server

```bash
cd web-server
npm start
```

### 5. Access Web Interface

Open http://localhost:3033 in your browser

## API Endpoints

### Video Generation

```http
POST /api/video/create
Content-Type: application/json

{
  "prompt": "A beautiful sunset over mountains",
  "orientation": "landscape",
  "size": "large",
  "watermark": false,
  "private": true,
  "images": ["url1", "url2"]
}
```

### Generate with Progress Tracking

```http
POST /api/video/generate-and-follow
Content-Type: application/json

{
  "prompt": "A beautiful sunset over mountains",
  "orientation": "landscape"
}
```

### Query Status

```http
GET /api/video/status/{taskId}
Authorization: Bearer {api_key}
```

### Get All Tasks

```http
GET /api/tasks
```

### Upload Image

```http
POST /api/upload
Content-Type: multipart/form-data

file: [image_file]
```

## WebSocket Events

### Client to Server

```javascript
// Subscribe to task updates
{
  type: "subscribeToTask",
  data: { taskId: "task_id" }
}

// Unsubscribe from task
{
  type: "unsubscribeFromTask",
  data: { taskId: "task_id" }
}
```

### Server to Client

```javascript
// Initial connection
{
  type: "init",
  data: { tasks: [...] }
}

// Task created
{
  type: "taskCreated",
  data: { taskId: "task_id", type: "video" }
}

// Task updated
{
  type: "taskUpdated",
  data: { taskId: "task_id", task: {...} }
}

// Progress update
{
  type: "progress",
  data: { taskId: "task_id", progress: 50, status: "processing" }
}

// Task completed
{
  type: "completed",
  data: { taskId: "task_id", videoUrl: "url" }
}

// Task failed
{
  type: "failed",
  data: { taskId: "task_id", error: "error_message" }
}
```

## Best Practices

### 1. Error Handling

- Always wrap API calls in try-catch blocks
- Provide user-friendly error messages
- Implement retry logic for transient failures
- Log errors for debugging

### 2. Performance

- Use WebSocket for real-time updates instead of polling
- Implement pagination for task lists
- Cache frequently accessed data
- Use CDN for static assets

### 3. Security

- Validate all input parameters
- Sanitize file uploads
- Implement rate limiting
- Use HTTPS in production
- Never expose API keys in frontend code

### 4. Task Management

- Store task state locally for reliability
- Implement task cleanup for old/failed tasks
- Use background workers for heavy operations
- Provide batch operations for efficiency

### 5. User Experience

- Show progress indicators for long operations
- Provide task cancellation options
- Implement notifications for status changes
- Use animations for smooth transitions

## Troubleshooting

### TypeScript Compilation Errors

1. Ensure all dependencies are installed:
   ```bash
   npm install
   ```

2. Check tsconfig.json configuration:
   - Module resolution should be "node"
   - Target should be "ES2022"
   - Ensure correct include/exclude paths

3. Clean build:
   ```bash
   rm -rf dist
   npm run build
   ```

### WebSocket Connection Issues

1. Check if server is running:
   ```bash
   netstat -an | grep :3033
   ```

2. Verify WebSocket URL:
   ```javascript
   const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
   const wsUrl = `${protocol}//${window.location.host}`;
   ```

3. Handle connection errors gracefully with auto-reconnect

### File Upload Issues

1. Check multer configuration:
   - Ensure upload directory exists
   - Verify file size limits
   - Check file type validation

2. Handle CORS for file uploads:
   ```javascript
   app.use(cors({
     origin: true,
     credentials: true
   }));
   ```

### API Client Issues

1. Verify API key is correctly set
2. Check base URL is correct
3. Handle authentication errors:
   ```javascript
   if (response.status === 401) {
     // Handle unauthorized
   }
   ```

## Production Deployment

### Environment Setup

1. Use environment variables for configuration:
   ```
   JUXIN_API_KEY=your_api_key
   JUXIN_API_BASE_URL=https://api.jxincm.cn
   PORT=3033
   NODE_ENV=production
   ```

2. Use PM2 for process management:
   ```bash
   npm install -g pm2
   pm2 start server-v2.js --name "juxin-web"
   ```

3. Set up reverse proxy with Nginx:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3033;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

### Monitoring

1. Implement health check endpoint
2. Add logging with Winston or similar
3. Set up monitoring with Prometheus/Grafana
4. Implement alerting for errors

### Scaling

1. Use Redis for session sharing
2. Implement task queue with Bull or similar
3. Use database for persistent storage
4. Implement caching with Redis

## Next Steps

1. Add user authentication
2. Implement user-specific task isolation
3. Add video preview thumbnails
4. Implement batch operations
5. Add export/import functionality
6. Create mobile app version
7. Implement webhook notifications
8. Add analytics and usage tracking

## Conclusion

This integration provides a robust solution for web-based access to MCP tools. The direct API approach offers better performance and reliability for web applications while maintaining compatibility with the MCP ecosystem.