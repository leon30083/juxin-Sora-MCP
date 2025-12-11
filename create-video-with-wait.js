#!/usr/bin/env node

/**
 * 使用等待完成功能创建视频
 */

import { JuxinApiClient } from "./dist/juxin-client.js";

const apiKey = "sk-Q6DwAtsNvutSlaZXYAzXR39pUmwKHAHDgll0QifCL5GbwJd7";
const client = new JuxinApiClient(apiKey);

async function createVideoAndWait() {
  console.log("\n🎬 创建电影大片感视频（自动等待完成）");
  console.log("=" .repeat(60));

  const createRequest = {
    images: [],
    model: "sora-2",
    orientation: "landscape",
    prompt: "一个优雅的女人在繁华的城市大街上漫步，电影大片质感，好莱坞风格，黄金时刻的光线，慢动作效果，镜头跟随，电影级调色，高端电影感，cinematic lighting",
    size: "large",
    duration: 15,
    watermark: false,
    private: true
  };

  try {
    // 1. 创建任务
    console.log("\n📝 创建视频任务...");
    const createResponse = await client.createVideo(createRequest);
    console.log(`✅ 任务创建成功！ID: ${createResponse.id}`);

    // 2. 等待完成
    console.log("\n⏳ 等待视频生成完成（这可能需要几分钟）...");

    const result = await client.waitForVideoCompletion(createResponse.id, {
      pollingInterval: 15000, // 每15秒查询一次
      timeout: 600000 // 10分钟超时
    });

    // 3. 显示结果
    console.log("\n🎉 视频生成完成！");
    console.log("\n📥 正在下载视频到工作区...");

    // 使用curl下载
    const { spawn } = await import("child_process");
    const curl = spawn("curl", [
      "-o", "女人漫步电影大片.mp4",
      result.videoUrl
    ]);

    curl.stdout.on("data", (data) => {
      process.stdout.write(".");
    });

    curl.on("close", (code) => {
      if (code === 0) {
        console.log("\n\n✅ 视频下载成功！");
        console.log("文件名: 女人漫步电影大片.mp4");
        console.log("位置: 当前工作目录");

        console.log("\n📹 视频信息:");
        console.log("- 风格: 电影大片感");
        console.log("- 分辨率: 横屏16:9");
        console.log("- 时长: 15秒");
        console.log("- 质量: 1080p高清");
        console.log("- 水印: 无");

        // 检查文件大小
        const fs = await import("fs/promises");
        try {
          const stats = await fs.stat("女人漫步电影大片.mp4");
          console.log(`- 文件大小: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
        } catch (e) {
          // 忽略
        }

      } else {
        console.log(`\n❌ 下载失败，退出代码: ${code}`);
      }
    });

    curl.on("error", (err) => {
      console.error("\n❌ 下载出错:", err.message);
    });

  } catch (error) {
    console.error("\n❌ 错误:", error.message);
  }
}

createVideoAndWait();