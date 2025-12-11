#!/usr/bin/env node

/**
 * 演示更新后的默认设置
 * - 默认横屏（landscape）
 * - 默认无水印（watermark: false）
 * - 默认15秒时长
 */

import { JuxinApiClient } from "./dist/juxin-client.js";

const apiKey = "sk-Q6DwAtsNvutSlaZXYAzXR39pUmwKHAHDgll0QifCL5GbwJd7";
const client = new JuxinApiClient(apiKey);

async function demoNewDefaults() {
  console.log("\n" + "=".repeat(60));
  console.log("🎬 聚鑫 Sora-2 MCP 工具 - 新默认设置演示");
  console.log("=".repeat(60));

  console.log("\n📝 新的默认设置:");
  console.log("   ✓ 默认横屏（16:9）");
  console.log("   ✓ 默认无水印");
  console.log("   ✓ 默认15秒时长");

  // 使用新的默认设置创建视频
  console.log("\n🎥 创建视频（使用新默认设置）...");
  console.log("   提示词：一片金色的麦田在风中摇曳，蓝天白云");
  console.log("   （将使用默认：横屏、无水印、15秒）");

  const createRequest = {
    images: [],
    model: "sora-2",
    prompt: "一片金色的麦田在风中摇曳，蓝天白云，自然风光",
    // 注意：不指定 orientation、watermark、duration，将使用默认值
  };

  try {
    const response = await client.createVideo(createRequest);

    console.log("\n✅ 视频创建成功！");
    console.log(`   任务ID: ${response.id}`);
    console.log(`   状态: ${response.status}`);

    console.log("\n💡 因为使用了新的默认设置：");
    console.log("   - 视频将是横屏（16:9）");
    console.log("   - 不会添加水印");
    console.log("   - 时长为15秒");

    // 可以使用 monitor-task.js 来监控这个任务
    console.log("\n🔍 要监控任务进度，请运行：");
    console.log(`   node monitor-task.js`);
    console.log("\n（需要将脚本中的 taskId 更改为上面的任务ID）");

  } catch (error) {
    console.error("\n❌ 创建失败:", error.message);
  }

  console.log("\n" + "=".repeat(60));
}

demoNewDefaults();