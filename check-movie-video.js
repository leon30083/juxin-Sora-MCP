#!/usr/bin/env node

/**
 * 查询电影视频任务状态
 */

import { JuxinApiClient } from "./dist/juxin-client.js";

const apiKey = "sk-Q6DwAtsNvutSlaZXYAzXR39pUmwKHAHDgll0QifCL5GbwJd7";
const client = new JuxinApiClient(apiKey);

async function checkMovieVideo() {
  const taskId = "video_14219dce-c1de-4242-b723-2c3f4b90be9e";

  console.log("\n🎬 查询电影大片感视频状态");
  console.log("=" .repeat(50));
  console.log(`任务ID: ${taskId}`);

  try {
    const response = await client.queryVideoStatus({ id: taskId });

    console.log(`\n📊 状态: ${response.status}`);

    switch (response.status) {
      case "pending":
      case "queued":
        console.log("⏳ 仍在排队中...");
        break;

      case "processing":
      case "in_progress":
        console.log("🔄 正在生成中...");
        break;

      case "completed":
        console.log("\n✅ 视频生成完成！");
        console.log(`视频链接: ${response.video_url}`);
        if (response.thumbnail_url) {
          console.log(`缩略图: ${response.thumbnail_url}`);
        }
        console.log("\n💡 电影大片感视频已准备就绪！");
        break;

      case "failed":
        console.log(`❌ 生成失败: ${response.error || "未知错误"}`);
        break;
    }

    if (response.status === "completed" && response.video_url) {
      // 下载视频
      console.log("\n📥 正在下载视频...");
      const { spawn } = await import("child_process");
      const curl = spawn("curl", [
        "-o", "女人漫步电影大片.mp4",
        response.video_url
      ]);

      curl.on("close", (code) => {
        if (code === 0) {
          console.log("\n✅ 视频下载成功！");
          console.log("文件名: 女人漫步电影大片.mp4");
        } else {
          console.log(`\n❌ 下载失败，退出代码: ${code}`);
        }
      });
    }

  } catch (error) {
    console.error("\n❌ 查询失败:", error.message);
  }
}

checkMovieVideo();