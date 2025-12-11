#!/usr/bin/env node

/**
 * 测试聊天格式的角色视频创建
 * 直接返回视频链接，无需等待
 */

import { JuxinApiClient } from "./dist/juxin-client.js";
import fs from "fs/promises";

const apiKey = "sk-Q6DwAtsNvutSlaZXYAzXR39pUmwKHAHDgll0QifCL5GbwJd7";
const client = new JuxinApiClient(apiKey);

// 测试用例
const testCases = [
  {
    name: "李世民登基",
    prompt: "@rsgvoepwj.valor_knig 登基称帝，身穿龙袍，气势恢宏，电影大片感"
  },
  {
    name: "李建成漫步",
    prompt: "@fpjhyfzxl.grandvizie 在宫殿花园中漫步，身穿华丽朝服，表情深思"
  },
  {
    name: "李元吉射箭",
    prompt: "@jasvwqpvt.hanblueher 在校场练习射箭，英姿飒爽"
  },
  {
    name: "三人并驾",
    prompt: "@fpjhyfzxl.grandvizie, @jasvwqpvt.hanblueher, and @rsgvoepwj.valor_knig 三人并驾齐驱，讨论国事"
  }
];

async function testChatFormatCharacter() {
  console.log("\n🚀 测试聊天格式角色视频创建");
  console.log("=" * 80);
  console.log("特点：直接返回视频链接，无需等待队列");

  const results = [];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n${i + 1}. 测试: ${testCase.name}`);
    console.log(`   提示词: ${testCase.prompt}`);

    try {
      const response = await client.createCharacterVideoChat(testCase.prompt);

      console.log(`   ✅ 成功!`);
      console.log(`   视频链接: ${response.videoUrl}`);

      // 保存结果
      results.push({
        name: testCase.name,
        prompt: testCase.prompt,
        success: true,
        videoUrl: response.videoUrl
      });

      // 保存到文件
      await fs.appendFile("chat-character-videos.txt",
        `${testCase.name}: ${response.videoUrl}\n`);

    } catch (error) {
      console.error(`   ❌ 失败: ${error.message}`);

      results.push({
        name: testCase.name,
        prompt: testCase.prompt,
        success: false,
        error: error.message
      });
    }
  }

  // 保存详细结果
  try {
    await fs.writeFile("chat-character-results.json",
      JSON.stringify({
        timestamp: new Date().toISOString(),
        results: results
      }, null, 2));
  } catch (error) {
    console.error("\n⚠️ 保存结果失败:", error.message);
  }

  // 显示汇总
  console.log("\n📊 测试汇总:");
  console.log(`   总测试数: ${testCases.length}`);
  console.log(`   成功: ${results.filter(r => r.success).length}`);
  console.log(`   失败: ${results.filter(r => !r.success).length}`);

  if (results.some(r => r.success)) {
    console.log("\n💡 成功的视频链接已保存到:");
    console.log("   - chat-character-videos.txt (简单格式)");
    console.log("   - chat-character-results.json (详细格式)");

    console.log("\n📥 下载视频:");
    console.log("   您可以使用 curl 或浏览器下载视频");
  }
}

// 运行测试
async function main() {
  console.log("🎬 聚鑫API聊天格式角色视频测试");
  console.log("=" * 80);
  console.log("使用 /v1/chat/completions 端点");
  console.log("快速响应，直接获取视频链接");

  await testChatFormatCharacter();

  console.log("\n✨ 测试完成！");
  console.log("\n📌 发现:");
  console.log("1. 聊天格式可以快速创建角色视频");
  console.log("2. 直接返回视频链接，无需等待");
  console.log("3. 适合快速测试和原型开发");
  console.log("4. 可能适用于较简单的视频生成");
}

main().catch(console.error);