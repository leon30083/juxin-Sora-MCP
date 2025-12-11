#!/usr/bin/env node

/**
 * 构建并测试脚本
 * 使用方法: node scripts/build-test.js
 */

import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");

console.log("🔨 开始构建项目...\n");

// 执行构建
const buildProcess = spawn("npm", ["run", "build"], {
  cwd: projectRoot,
  stdio: "inherit"
});

buildProcess.on("close", (code) => {
  if (code === 0) {
    console.log("\n✅ 构建成功！\n");

    // 检查 dist 目录是否存在
    const distPath = path.join(projectRoot, "dist");
    fs.stat(distPath)
      .then(() => {
        console.log("📦 dist 目录已创建\n");
        console.log("🎯 现在可以运行以下命令之一:\n");
        console.log("   1. 使用 MCP Inspector 测试:");
        console.log("      npx @modelcontextprotocol/inspector dist/index.js\n");
        console.log("   2. 直接运行测试:");
        console.log("      node scripts/test-server.js\n");
        console.log("   3. 在 Claude Desktop 中配置使用\n");
      })
      .catch(() => {
        console.error("❌ dist 目录未找到，构建可能失败");
      });
  } else {
    console.error(`\n❌ 构建失败，退出代码: ${code}`);
    process.exit(1);
  }
});