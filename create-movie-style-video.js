#!/usr/bin/env node

/**
 * 创建电影大片感的视频
 */

import { JuxinApiClient } from "./dist/juxin-client.js";

const apiKey = "sk-Q6DwAtsNvutSlaZXYAzXR39pUmwKHAHDgll0QifCL5GbwJd7";
const client = new JuxinApiClient(apiKey);

async function createMovieVideo() {
  console.log("\n" + "=".repeat(60));
  console.log("🎬 创建电影大片感视频");
  console.log("=".repeat(60));

  // 创建电影风格视频
  console.log("\n🎥 视频参数:");
  console.log("   场景：一个女人在大街上漫步");
  console.log("   风格：电影大片感");
  console.log("   默认设置：横屏16:9、无水印、15秒");

  const createRequest = {
    images: [],
    model: "sora-2",
    orientation: "landscape", // 横屏，电影感
    prompt: "一个优雅的女人在繁华的城市大街上漫步，电影大片质感，好莱坞风格，黄金时刻的光线，慢动作效果，镜头跟随，电影级调色，cinematic lighting，高端电影感",
    size: "large", // 1080p，更高质量
    duration: 15, // 15秒
    watermark: false, // 无水印
    private: true
  };

  try {
    console.log("\n📝 正在创建视频...");
    const response = await client.createVideo(createRequest);

    console.log("\n✅ 视频任务创建成功！");
    console.log(`   任务ID: ${response.id}`);
    console.log(`   状态: ${response.status}`);

    console.log("\n🎬 视频特点:");
    console.log("   - 电影级调色和 lighting");
    console.log("   - 黄金时刻光线效果");
    console.log("   - 慢动作镜头感");
    console.log("   - 横屏16:9比例");
    console.log("   - 1080p高清画质");
    console.log("   - 15秒时长");

    // 开始监控任务
    console.log("\n" + "=".repeat(60));
    console.log("📊 开始监控生成进度...");
    console.log("=".repeat(60));

    const taskId = response.id;
    let lastStatus = "";
    let pollCount = 0;
    const maxPolls = 60; // 最多轮询60次（10分钟）

    while (pollCount < maxPolls) {
      pollCount++;

      try {
        const status = await client.queryVideoStatus({ id: taskId });

        if (status.status !== lastStatus) {
          console.log(`\n[${new Date().toLocaleTimeString()}] 状态:`);

          switch (status.status) {
            case "pending":
            case "queued":
              console.log("⏳ 任务排队中...");
              break;

            case "in_progress":
            case "processing":
              console.log("🔄 正在生成电影级视频...");
              break;

            case "completed":
              console.log("\n🎉 视频生成完成！");
              console.log("\n🎥 电影大片视频:");
              console.log(`   任务ID: ${status.id}`);
              console.log(`   视频链接: ${status.video_url}`);
              if (status.thumbnail_url) {
                console.log(`   缩略图: ${status.thumbnail_url}`);
              }
              console.log(`   分辨率: ${status.width}x${status.height}`);

              console.log("\n💡 提示:");
              console.log("   - 点击视频链接下载");
              console.log("   - 视频具有电影大片质感");
              console.log("   - 适合用作宣传片或艺术展示");
              return;

            case "failed":
              console.log(`❌ 生成失败: ${status.error || "未知错误"}`);
              return;
          }

          lastStatus = status.status;
        }

        // 等待10秒后再次查询
        if (status.status !== "completed" && status.status !== "failed") {
          await new Promise(resolve => setTimeout(resolve, 10000));
        }

      } catch (error) {
        console.error(`\n查询失败: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }

    console.log("\n⚠️ 监控超时");

  } catch (error) {
    console.error("\n❌ 创建失败:", error.message);
  }
}

createMovieVideo();