#!/usr/bin/env node

/**
 * 测试脚本 - 用于快速测试 MCP 服务器
 * 使用方法: node scripts/test-server.js
 */

import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");

// 设置环境变量
process.env.JUXIN_API_KEY = process.env.JUXIN_API_KEY || "sk-Q6DwAtsNvutSlaZXYAzXR39pUmwKHAHDgll0QifCL5GbwJd7";
process.env.JUXIN_API_BASE_URL = process.env.JUXIN_API_BASE_URL || "https://api.jxincm.cn";
process.env.MCP_SERVER_NAME = "juxin-mcp-server-test";
process.env.MCP_SERVER_VERSION = "1.0.0";

console.log("🚀 启动聚鑫 MCP 服务器测试...\n");
console.log("📋 配置信息:");
console.log(`   - API地址: ${process.env.JUXIN_API_BASE_URL}`);
console.log(`   - API密钥: ${process.env.JUXIN_API_KEY.substring(0, 10)}...`);
console.log(`   - 项目路径: ${projectRoot}\n`);

// 启动服务器
const serverProcess = spawn("node", ["dist/index.js"], {
  cwd: projectRoot,
  stdio: ["inherit", "inherit", "pipe"],
  env: {
    ...process.env,
    NODE_ENV: "development"
  }
});

// 处理错误输出
serverProcess.stderr?.on("data", (data) => {
  const message = data.toString().trim();
  if (message) {
    console.error(`[错误] ${message}`);
  }
});

// 处理服务器退出
serverProcess.on("close", (code) => {
  if (code === 0) {
    console.log("\n✅ 服务器已正常退出");
  } else {
    console.error(`\n❌ 服务器异常退出，代码: ${code}`);
  }
});

// 处理中断信号
process.on("SIGINT", () => {
  console.log("\n\n🛑 正在停止服务器...");
  serverProcess.kill("SIGINT");
});

process.on("SIGTERM", () => {
  console.log("\n\n🛑 正在停止服务器...");
  serverProcess.kill("SIGTERM");
});

console.log("📍 提示:");
console.log("   - 如果 dist/index.js 不存在，请先运行 npm run build");
console.log("   - 按 Ctrl+C 停止服务器");
console.log("   - 建议使用 MCP Inspector 进行交互式测试:\n");
console.log("     npx @modelcontextprotocol/inspector dist/index.js\n");