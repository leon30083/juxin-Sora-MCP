#!/usr/bin/env node

/**
 * MCP服务器诊断工具
 */

import { spawn } from "child_process";
import { existsSync } from "fs";
import path from "path";

console.log("\n🔍 MCP 服务器诊断工具");
console.log("=" .repeat(50));

// 1. 检查 Claude Desktop 的配置文件路径
const configPaths = {
  macos: path.join(process.env.HOME || "", "Library/Application Support/Claude/claude_desktop_config.json"),
  windows: path.join(process.env.APPDATA || "", "Claude/claude_desktop_config.json")
};

const configPath = configPaths[process.platform] || configPaths.windows;
console.log(`\n📁 Claude Desktop 配置文件路径:`);
console.log(`   ${configPath}`);

// 2. 检查配置文件是否存在
if (existsSync(configPath)) {
  console.log("\n✅ 配置文件存在");

  // 读取配置内容
  try {
    const fs = await import("fs/promises");
    const config = JSON.parse(await fs.readFile(configPath, "utf-8"));

    console.log("\n📋 当前配置的MCP服务器:");
    if (config.mcpServers) {
      Object.entries(config.mcpServers).forEach(([name, config], index) => {
        const status = Object.keys(config).includes("sora2-mcp") && name === "sora2-mcp" ? "✅" :
                     Object.keys(config).includes("context7") && name === "context7" ? "✅" :
                     Object.keys(config).includes("memory") && name === "memory" ? "✅" : "❌";

        console.log(`   ${index + 1}. ${name} ${status}`);
        console.log(`      命令: ${config.command}`);
        if (config.args) {
          console.log(`      参数: ${config.args.join(" ")}`);
        }
        if (config.env) {
          console.log(`      环境变量: ${Object.keys(config.env).join(", ")}`);
        }
      });
    }

    // 3. 诊断特定的问题
    console.log("\n🔍 诊断结果:");

    // 检查 sora2-mcp 配置
    if (config.mcpServers?.sora2_mcp) {
      const sora2Config = config.mcpServers.sora2_mcp;
      console.log("\n✅ sora2-mcp 配置存在");

      // 检查路径
      if (sora2Config.command === "node") {
        if (sora2Config.args && sora2Config.args.length > 0) {
          const serverPath = sora2Config.args[0];
          const absPath = path.resolve(process.cwd(), serverPath);

          console.log(`\n   服务器路径: ${serverPath}`);
          console.log(`   绝对路径: ${absPath}`);

          if (existsSync(absPath)) {
            console.log("   ✅ 服务器文件存在");

            // 检查 dist 目录
            const distPath = path.join(path.dirname(absPath), "dist");
            if (existsSync(distPath)) {
              console.log("   ✅ dist 目录存在");

              // 检查主文件
              const mainFile = path.join(distPath, "index.js");
              if (existsSync(mainFile)) {
                console.log("   ✅ 主编译文件存在");

                // 检查文件是否是最近的
                const fs = await import("fs/promises");
                const stats = await fs.stat(mainFile);
                const hours = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60);

                if (hours < 1) {
                  console.log("   ✅ 文件是最新的（1小时内）");
                } else if (hours < 24) {
                  console.log(`   ⚠️  文件是 ${Math.round(hours)}小时前的，可能需要重新构建`);
                } else {
                  console.log(`   ❌ 文件已过期（${Math.round(hours)}小时前），请重新构建`);
                }
              } else {
                console.log("   ❌ 主编译文件不存在，请运行 npm run build");
              }
            } else {
              console.log("   ❌ dist 目录不存在，请运行 npm run build");
            }
          } else {
            console.log(`   ❌ 服务器文件不存在: ${serverPath}`);
            console.log("   💡 提示: 请确认文件路径是否正确");
          }
        }

        // 检查环境变量
        if (sora2Config.env) {
          console.log("\n   环境变量:");
          if (sora2Config.env.JUXIN_API_KEY) {
            console.log("   ✅ JUXIN_API_KEY 已设置");
          } else {
            console.log("   ❌ JUXIN_API_KEY 未设置");
            console.log("   💡 提示: 需要设置 JUXIN_API_KEY 环境变量");
          }
        }
      }
    } else {
      console.log("\n❌ 未找到 mcpServers 配置");
      console.log("   💡 提示: 需要在配置文件中添加 mcpServers 部分");
    }

    // 4. 提供修复建议
    console.log("\n🛠️ 修复建议:");
    console.log("   1. 如果文件不存在，请确保:");
    console.log("      - 运行 npm run build 编译服务器");
    console.log("      - 确认服务器路径正确");
    console.log("\n   2. 如果环境变量缺失，请:");
    console.log("      - 在配置文件的 env 部分添加: { \"JUXIN_API_KEY\": \"sk-...\" }");
    console.log("      - 或者使用 .env 文件设置环境变量");
    console.log("\n   3. 如果重新构建，请运行:");
    console.log("      - npm run build");
    console.log("      - 然后重启 Claude Desktop");

    console.log("\n   4. 测试连接:");
    console.log("      - 运行: npx @modelcontextprotocol/inspector dist/index.js");

  } catch (error) {
    console.log("\n❌ 读取配置文件失败:", error.message);
    console.log("\n💡 建议操作:");
    console.log("   1. 检查 Claude Desktop 是否正在运行");
    console.log("   2. 确认配置文件权限正确");
    console.log("   3. 尝试手动创建或修复配置文件");
  }
} else {
  console.log("\n❌ 配置文件不存在");
  console.log("\n💡 创建步骤:");
  console.log("   1. 在配置文件中添加以下内容:");
  console.log(`\n{\n  "mcpServers": {\n    "sora2-mcp": {\n      "command": "node",\n      "args": ["${path.resolve(process.cwd(), "dist/index.js")}"],\n      "env": {\n        "JUXIN_API_KEY": "你的API密钥"\n      }\n    }\n  }\n}`);
  console.log("\n   2. 重启 Claude Desktop");
  }
}

// 5. 检查项目状态
console.log("\n📦 项目状态检查:");
try {
  const packageJson = JSON.parse(await import("fs/promises").then(fs => fs.readFileSync("package.json", "utf-8")));
  console.log(`   ✅ package.json 存在`);
  console.log(`   版本: ${packageJson.version}`);

  if (packageJson.scripts?.build) {
    console.log(`   ✅ build 脚本存在`);
  } else {
    console.log(`   ❌ build 脚本不存在`);
  }

  if (packageJson.dependencies) {
    console.log(`   ✅ 依赖已安装`);
  } else {
    console.log(`   ❌ 未安装依赖，请运行 npm install`);
  }
} catch (error) {
  console.log(`   ❌ 项目检查失败: ${error.message}`);
}

// 6. 生成测试命令
console.log("\n🧪 测试命令:");
console.log(`   # 构建: npm run build`);
console.log(`   # 本地测试: npx @modelcontextprotocol/inspector dist/index.js`);
console.log(`   # 检查环境变量: echo $JUXIN_API_KEY`);

diagnose().catch(console.error);