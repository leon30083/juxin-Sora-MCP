#!/usr/bin/env node

/**
 * 监控视频生成任务
 * 持续查询任务状态直到完成
 */

import { JuxinApiClient } from "./dist/juxin-client.js";

// 设置 API 密钥
const apiKey = "sk-Q6DwAtsNvutSlaZXYAzXR39pUmwKHAHDgll0QifCL5GbwJd7";
const client = new JuxinApiClient(apiKey);

async function monitorTask(taskId) {
  console.log(`\n🎬 开始监控视频生成任务`);
  console.log(`任务ID: ${taskId}`);
  console.log("=" .repeat(60));

  let lastStatus = "";
  let pollCount = 0;
  const maxPolls = 120; // 最多轮询120次（20分钟）

  while (pollCount < maxPolls) {
    pollCount++;

    try {
      const response = await client.queryVideoStatus({ id: taskId });

      // 只在状态变化时显示
      if (response.status !== lastStatus) {
        console.log(`\n[${new Date().toLocaleTimeString()}] 状态更新:`);

        switch (response.status) {
          case "pending":
          case "queued":
            const progress = response.detail?.pending_info?.progress_pct || 0;
            console.log(`⏳ 排队中 - 进度: ${Math.round(progress * 100)}%`);
            const waitTime = response.detail?.pending_info?.estimated_queue_wait_time;
            if (waitTime) {
              console.log(`   预计等待时间: ${Math.round(waitTime / 1000)}秒`);
            }
            break;

          case "in_progress":
          case "processing":
            console.log(`🔄 正在生成视频...`);
            break;

          case "completed":
            console.log(`✅ 视频生成完成！`);
            console.log(`\n📹 视频信息:`);
            console.log(`   - 分辨率: ${response.width}x${response.height}`);
            console.log(`   - 视频链接: ${response.video_url}`);
            if (response.thumbnail_url) {
              console.log(`   - 缩略图: ${response.thumbnail_url}`);
            }

            console.log(`\n🎉 任务完成！你可以下载视频了。`);
            return; // 结束监控

          case "failed":
            console.log(`❌ 生成失败: ${response.error || "未知错误"}`);
            return; // 结束监控
        }

        lastStatus = response.status;
      }

      // 如果还在处理中，显示进度点
      if (pollCount % 5 === 0 && (response.status === "in_progress" || response.status === "processing")) {
        process.stdout.write(".");
      }

      // 等待10秒后再次查询
      if (response.status !== "completed" && response.status !== "failed") {
        await new Promise(resolve => setTimeout(resolve, 10000));
      }

    } catch (error) {
      console.error(`\n❌ 查询失败 (${pollCount}/${maxPolls}): ${error.message}`);

      if (pollCount >= maxPolls) {
        console.error("\n⚠️ 达到最大轮询次数，停止监控");
        break;
      }

      // 出错时等待10秒后重试
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }

  console.log(`\n⚠️ 监控超时，已轮询${pollCount}次`);
}

// 使用之前创建的任务ID
const taskId = "video_e8b28eb6-ee5b-4fc7-bc6d-9c22236369fd";

// 如果要查询特定任务，请修改taskId的值
// 例如：const taskId = "video_xxxxx"; // 替换为你的任务ID

monitorTask(taskId);