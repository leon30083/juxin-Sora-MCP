#!/usr/bin/env node

/**
 * 检查所有已知任务
 */

import { JuxinApiClient } from "./dist/juxin-client.js";

const apiKey = "sk-Q6DwAtsNvutSlaZXYAzXR39pUmwKHAHDgll0QifCL5GbwJd7";
const client = new JuxinApiClient(apiKey);

// 所有已知的任务ID
const allTasks = [
  {
    id: "video_14219dce-c1de-4242-b723-2c3f4b90be9e",
    description: "电影大片感视频 - 女人在大街上漫步",
    status: "completed"
  },
  {
    id: "video_e8b28eb6-ee5b-4fc7-bc6d-9c22236369fd",
    description: "小猫樱花树视频",
    status: "completed"
  },
  {
    id: "video_a951df6d-36e4-43b8-a69f-fe9b8d7c222a",
    description: "测试视频 - 金色麦田",
    status: "unknown"
  },
  {
    id: "video_9c22236369fd",
    description: "用户查询的部分ID",
    status: "unknown"
  }
];

async function checkAllTasks() {
  console.log("\n🔍 检查所有视频任务");
  console.log("=" .repeat(60));

  for (const task of allTasks) {
    console.log(`\n📋 ${task.description}`);
    console.log(`任务ID: ${task.id}`);

    try {
      const response = await client.queryVideoStatus({ id: task.id });
      console.log(`状态: ${response.status}`);

      if (response.status === "completed") {
        console.log(`✅ 已完成 - 视频链接: ${response.video_url}`);
      } else if (response.status === "failed") {
        console.log(`❌ 失败: ${response.error || "未知错误"}`);
      } else {
        console.log(`⏳ 状态: ${response.status}`);
      }

    } catch (error) {
      console.log(`❌ 查询失败: ${error.message}`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("\n📁 当前工作区视频文件:");
  const { execSync } = await import("child_process");
  try {
    const files = execSync("ls -lh *.mp4 2>/dev/null || echo '无MP4文件'", { encoding: "utf8" });
    console.log(files);
  } catch (e) {
    console.log("无法列出文件");
  }
}

checkAllTasks();