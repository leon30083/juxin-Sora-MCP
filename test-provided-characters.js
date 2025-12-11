#!/usr/bin/env node

/**
 * 测试用户提供的角色创建视频
 */

import { JuxinApiClient } from "./dist/juxin-client.js";

const apiKey = "sk-Q6DwAtsNvutSlaZXYAzXR39pUmwKHAHDgll0QifCL5GbwJd7";
const client = new JuxinApiClient(apiKey);

// 用户提供的角色
const characters = {
  "李元吉": "jasvwqpvt.hanblueher",
  "李建成": "fpjhyfzxl.grandvizie",
  "李世民": "rsgvoepwj.valor_knig"
};

async function testCharacterVideos() {
  console.log("\n🎭 使用提供的角色创建视频");
  console.log("=" * 80);

  for (const [name, username] of Object.entries(characters)) {
    console.log(`\n🎬 创建角色视频: ${name} (@${username})`);
    console.log("-".repeat(60));

    try {
      const response = await client.createVideo({
        prompt: `@${username} 在古代宫殿中，身穿华丽朝服，气势恢宏，电影大片感`,
        orientation: "landscape",
        size: "small",
        duration: 15,
        watermark: false,
        private: true,
        images: []
      });

      console.log(`✅ 视频创建成功！`);
      console.log(`任务ID: ${response.id}`);
      console.log(`状态: ${response.status}`);

      // 保存任务ID到文件
      const fs = await import("fs/promises");
      await fs.appendFile("character-task-ids.txt", `${name}: ${response.id}\n`);

      console.log(`💡 提示: 使用 query-single-task.js ${response.id} 查询生成进度`);
    } catch (error) {
      console.error(`❌ 创建失败: ${error.message}`);
    }
  }

  console.log("\n📋 所有任务ID已保存到 character-task-ids.txt");
}

// 运行测试
async function main() {
  console.log("🏛️  唐朝角色视频生成测试");
  console.log("=" * 80);

  await testCharacterVideos();

  console.log("\n✨ 测试完成！");
  console.log("\n📌 后续操作:");
  console.log("1. 使用 'query-single-task.js <task-id>' 查询单个任务状态");
  console.log("2. 使用 'node -e \"require('./dist/index.js')'\" 启动MCP服务器");
}

main().catch(console.error);