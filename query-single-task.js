#!/usr/bin/env node

/**
 * 查询指定任务ID状态
 */

import { JuxinApiClient } from "./dist/juxin-client.js";

const apiKey = "sk-Q6DwAtsNvutSlaZXYAzXR39pUmwKHAHDgll0QifCL5GbwJd7";
const client = new JuxinApiClient(apiKey);

// 从命令行参数获取任务ID
const taskId = process.argv[2] || "video_2b1ca211-e23d-4ce1-96b3-d90e07af3642";

async function queryTask() {
  console.log(`\n🔍 查询任务状态: ${taskId}`);
  console.log("=" .repeat(60));

  try {
    const response = await client.queryVideoStatus({ id: taskId });

    console.log(`\n📊 任务详情:`);
    console.log(`任务ID: ${response.id}`);
    console.log(`状态: ${response.status}`);

    switch (response.status) {
      case "pending":
      case "queued":
        console.log("⏳ 排队中...");
        break;

      case "processing":
      case "in_progress":
        console.log("🔄 正在生成中...");
        break;

      case "completed":
        console.log("\n✅ 生成完成！");
        console.log(`\n视频链接: ${response.video_url}`);
        if (response.thumbnail_url) {
          console.log(`缩略图: ${response.thumbnail_url}`);
        }
        if (response.width && response.height) {
          console.log(`\n分辨率: ${response.width}x${response.height}`);
        }
        break;

      case "failed":
        console.log(`\n❌ 生成失败: ${response.error || "未知错误"}`);
        break;
    }

    const updateTime = response.status_update_time || Date.now();
    console.log(`\n最后更新: ${new Date(updateTime).toLocaleString()}`);

    // 如果已完成，询问是否要下载
    if (response.status === "completed" && response.video_url) {
      console.log(`\n💡 提示: 视频已完成，可以下载到工作区`);
    }

  } catch (error) {
    console.error(`\n❌ 查询失败: ${error.message}`);
  }
}

queryTask();