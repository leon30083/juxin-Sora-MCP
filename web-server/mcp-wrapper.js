// MCP Wrapper Service - Bridges Web interface with MCP tools
const { spawn } = require('child_process');
const EventEmitter = require('events');

class MCPWrapper extends EventEmitter {
  constructor() {
    super();
    this.mcpProcess = null;
    this.messageId = 0;
    this.pendingRequests = new Map();
    this.isReady = false;
  }

  async start() {
    return new Promise((resolve, reject) => {
      console.log('Starting MCP server...');

      // Start MCP server as child process
      this.mcpProcess = spawn('node', ['../dist/src/index.js'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          JUXIN_API_KEY: process.env.JUXIN_API_KEY || 'sk-Q6DwAtsNvutSlaZXYAzXR39pUmwKHAHDgll0QifCL5GbwJd7'
        }
      });

      this.mcpProcess.on('error', (error) => {
        console.error('MCP Process Error:', error);
        reject(error);
      });

      this.mcpProcess.on('close', (code) => {
        console.log(`MCP Process exited with code ${code}`);
        this.isReady = false;
      });

      // Setup communication
      this.setupCommunication();

      // Initialize MCP session
      setTimeout(async () => {
        try {
          await this.initialize();
          this.isReady = true;
          resolve();
        } catch (err) {
          reject(err);
        }
      }, 1000);
    });
  }

  setupCommunication() {
    let buffer = '';

    this.mcpProcess.stdout.on('data', (data) => {
      buffer += data.toString();

      // Process complete JSON messages
      while (buffer.includes('\n')) {
        const newlineIndex = buffer.indexOf('\n');
        const messageStr = buffer.substring(0, newlineIndex);
        buffer = buffer.substring(newlineIndex + 1);

        if (messageStr.trim()) {
          try {
            const message = JSON.parse(messageStr);
            this.handleMessage(message);
          } catch (err) {
            console.error('Failed to parse MCP message:', err);
          }
        }
      }
    });

    this.mcpProcess.stderr.on('data', (data) => {
      console.error('MCP stderr:', data.toString());
    });
  }

  async initialize() {
    // Send initialize request
    const response = await this.sendRequest({
      jsonrpc: "2.0",
      id: ++this.messageId,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {
          roots: {
            listChanged: true
          }
        },
        clientInfo: {
          name: "juxin-web-interface",
          version: "1.0.0"
        }
      }
    });

    // Send initialized notification
    this.sendNotification({
      jsonrpc: "2.0",
      method: "notifications/initialized"
    });
  }

  async listTools() {
    const response = await this.sendRequest({
      jsonrpc: "2.0",
      id: ++this.messageId,
      method: "tools/list",
      params: {}
    });
    return response.result.tools;
  }

  async callTool(toolName, args) {
    const response = await this.sendRequest({
      jsonrpc: "2.0",
      id: ++this.messageId,
      method: "tools/call",
      params: {
        name: toolName,
        arguments: args
      }
    });
    return response.result;
  }

  sendRequest(message) {
    return new Promise((resolve, reject) => {
      const id = message.id;

      // Store resolver for response
      this.pendingRequests.set(id, { resolve, reject });

      // Set timeout
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('MCP request timeout'));
        }
      }, 30000);

      // Send message
      this.sendMessage(message);
    });
  }

  sendNotification(message) {
    this.sendMessage(message);
  }

  sendMessage(message) {
    if (this.mcpProcess && this.mcpProcess.stdin) {
      this.mcpProcess.stdin.write(JSON.stringify(message) + '\n');
    }
  }

  handleMessage(message) {
    if (message.id && this.pendingRequests.has(message.id)) {
      const { resolve, reject } = this.pendingRequests.get(message.id);
      this.pendingRequests.delete(message.id);

      if (message.error) {
        reject(new Error(message.error.message));
      } else {
        resolve(message);
      }
    }
  }

  async stop() {
    if (this.mcpProcess) {
      this.mcpProcess.kill();
      this.mcpProcess = null;
    }
    this.isReady = false;
  }
}

module.exports = { MCPWrapper };