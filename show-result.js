#!/usr/bin/env node

/**
 * 显示任务完成结果
 */

import { JuxinApiClient } from "./dist/juxin-client.js";

const apiKey = "sk-Q6DwAtsNvutSlaZXYAzXR39pUmwKHAHDgll0QifCL5GbwJd7";
const client = new JuxinApiClient(apiKey);

async function showResult(taskId) {
  console.log("\n" + "=".repeat(60));
  console.log(`🎉 视频生成成功！`);
  console.log("=".repeat(60));

  const response = await client.queryVideoStatus({ id: taskId });

  console.log("\n📋 任务信息:");
  console.log(`   任务ID: ${response.id}`);
  console.log(`   状态: ${response.status}`);
  console.log(`   完成时间: ${new Date(response.status_update_time).toLocaleString()}`);

  console.log("\n🎥 视频信息:");
  console.log(`   视频链接: ${response.video_url}`);

  if (response.thumbnail_url) {
    console.log(`   缩略图: ${response.thumbnail_url}`);
  }

  if (response.width && response.height) {
    console.log(`   分辨率: ${response.width}x${response.height}`);
  }

  console.log("\n💡 提示:");
  console.log("   - 点击视频链接可以下载视频");
  console.log("   - 视频格式为 MP4，可以用任何视频播放器打开");
  console.log("   - 生成时间约1分钟，效果应该不错！");

  console.log("\n" + "=".repeat(60));
  console.log("\n✨ 感谢使用聚鑫 Sora-2 MCP 工具！");
}

// 使用刚才完成的任务ID
const taskId = "video_e8b28eb6-ee5b-4fc7-bc6d-9c22236369fd";

showResult(taskId).catch(console.error);