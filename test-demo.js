#!/usr/bin/env node

/**
 * 测试演示脚本
 * 演示如何调用聚鑫 MCP 服务器生成视频
 */

import { JuxinApiClient } from "./dist/juxin-client.js";

// 设置 API 密钥
const apiKey = "sk-Q6DwAtsNvutSlaZXYAzXR39pUmwKHAHDgll0QifCL5GbwJd7";
const client = new JuxinApiClient(apiKey);

async function testVideoGeneration() {
  console.log("🎬 开始测试聚鑫 Sora-2 视频生成...\n");

  try {
    // 1. 创建视频任务
    console.log("📝 创建视频任务...");
    const createRequest = {
      images: [], // 文生视频，不提供图片
      model: "sora-2",
      orientation: "portrait",
      prompt: "一只可爱的小猫咪在樱花树下玩耍，阳光明媚，动漫风格",
      size: "small",
      duration: 10,
      watermark: true,
      private: true
    };

    const createResponse = await client.createVideo(createRequest);
    console.log("✅ 视频任务创建成功！");
    console.log(`   任务ID: ${createResponse.id}`);
    console.log(`   初始状态: ${createResponse.status}\n`);

    // 2. 查询状态
    console.log("🔍 查询视频生成状态...");
    const taskId = createResponse.id;

    // 轮询查询状态
    for (let i = 0; i < 3; i++) {
      const status = await client.queryVideoStatus({ id: taskId });
      console.log(`\n第${i + 1}次查询:`);
      console.log(`   状态: ${status.status}`);

      if (status.status === "completed") {
        console.log(`   视频URL: ${status.video_url}`);
        break;
      } else if (status.status === "failed") {
        console.log(`   错误: ${status.error || "未知错误"}`);
        break;
      }

      // 等待3秒再查询
      if (i < 2) {
        console.log("   等待3秒后再次查询...");
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

  } catch (error) {
    console.error("❌ 测试失败:", error.message);
  }
}

// 运行测试
testVideoGeneration();