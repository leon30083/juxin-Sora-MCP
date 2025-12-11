#!/usr/bin/env node

/**
 * 查询特定任务状态
 */

import { JuxinApiClient } from "./dist/juxin-client.js";

// 设置 API 密钥
const apiKey = "sk-Q6DwAtsNvutSlaZXYAzXR39pUmwKHAHDgll0QifCL5GbwJd7";
const client = new JuxinApiClient(apiKey);

// 查询任务状态
async function queryTask(taskId) {
  console.log(`\n🔍 查询任务状态: ${taskId}`);
  console.log("=" .repeat(50));

  try {
    const response = await client.queryVideoStatus({ id: taskId });

    console.log(`\n📊 任务详情:`);
    console.log(`任务ID: ${response.id}`);
    console.log(`状态: ${response.status}`);

    switch (response.status) {
      case "pending":
      case "queued":
        const progress = response.detail?.pending_info?.progress_pct || 0;
        const waitTime = response.detail?.pending_info?.estimated_queue_wait_time;
        console.log(`进度: ${Math.round(progress * 100)}%`);
        if (waitTime) {
          console.log(`预计等待时间: ${Math.round(waitTime / 1000)}秒`);
        }
        break;

      case "processing":
        console.log("正在处理中...");
        break;

      case "completed":
        console.log("✅ 生成完成！");
        console.log(`\n视频链接: ${response.video_url}`);
        if (response.thumbnail_url) {
          console.log(`缩略图: ${response.thumbnail_url}`);
        }
        console.log(`\n分辨率: ${response.width}x${response.height}`);
        break;

      case "failed":
        console.log(`❌ 生成失败: ${response.error || "未知错误"}`);
        break;
    }

    const updateTime = response.status_update_time || Date.now();
    console.log(`\n最后更新: ${new Date(updateTime).toLocaleString()}`);

  } catch (error) {
    console.error(`\n❌ 查询失败: ${error.message}`);
  }
}

// 使用之前测试中创建的任务ID
const taskId = "video_e8b28eb6-ee5b-4fc7-bc6d-9c22236369fd";

// 如果要查询特定ID，可以替换上面的值
// const taskId = "9c22236369fd"; // 用户提供的部分ID

// 尝试不同的ID格式
const possibleIds = [
  taskId,
  `video_${taskId}`,
  `sora-2:task_${taskId}`,
  `9c22236369fd` // 尝试用户提供的ID
];

async function tryQuery() {
  for (const id of possibleIds) {
    try {
      console.log(`\n尝试使用ID: ${id}`);
      await queryTask(id);
      break; // 如果成功就退出
    } catch (error) {
      console.log(`该ID格式无效，尝试下一个...`);
    }
  }
}

tryQuery();