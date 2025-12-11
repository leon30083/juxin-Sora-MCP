#!/usr/bin/env node

/**
 * 检查最新的视频状态
 */

import { JuxinApiClient } from "./dist/juxin-client.js";

const apiKey = "sk-Q6DwAtsNvutSlaZXYAzXR39pUmwKHAHDgll0QifCL5GbwJd7";
const client = new JuxinApiClient(apiKey);

// 已知的任务ID
const tasks = [
  {
    id: "video_14219dce-c1de-4242-b723-2c3f4b90be9e",
    description: "电影大片感视频 - 女人在大街上漫步"
  },
  {
    id: "video_e8b28eb6-ee5b-4fc7-bc6d-9c22236369fd",
    description: "小猫樱花树视频"
  }
];

async function checkAllTasks() {
  console.log("\n🔍 检查所有视频任务状态");
  console.log("=" .repeat(60));

  for (const task of tasks) {
    console.log(`\n📋 ${task.description}`);
    console.log(`任务ID: ${task.id}`);

    try {
      const response = await client.queryVideoStatus({ id: task.id });

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
          console.log("✅ 生成完成！");
          console.log(`视频链接: ${response.video_url}`);

          // 下载视频
          console.log("\n📥 正在下载视频...");
          const { spawn } = await import("child_process");
          const filename = task.description.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "_") + ".mp4";
          const curl = spawn("curl", [
            "-o", filename,
            response.video_url
          ]);

          curl.on("close", (code) => {
            if (code === 0) {
              console.log(`✅ 下载成功: ${filename}`);
            } else {
              console.log(`❌ 下载失败，退出代码: ${code}`);
            }
          });
          break;

        case "failed":
          console.log(`❌ 生成失败: ${response.error || "未知错误"}`);
          break;
      }

    } catch (error) {
      console.error(`查询失败: ${error.message}`);
    }
  }

  console.log("\n" + "=".repeat(60));
}

checkAllTasks();