#!/usr/bin/env node

/**
 * 简单版本：查询任务并下载已完成的视频
 * 直接使用API，不依赖编译文件
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const apiKey = "sk-Q6DwAtsNvutSlaZXYAzXR39pUmwKHAHDgll0QifCL5GbwJd7";
const baseUrl = "https://api.jxincm.cn";

// 目标文件夹
const downloadDir = path.join(__dirname, "test");

async function ensureDownloadDir() {
  try {
    await fs.access(downloadDir);
  } catch {
    await fs.mkdir(downloadDir, { recursive: true });
    console.log(`✅ 创建下载目录: ${downloadDir}`);
  }
}

async function queryVideoStatus(taskId) {
  const url = new URL(`${baseUrl}/v1/video/query`);
  url.searchParams.append("id", taskId);

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${apiKey}`
    }
  });

  if (!response.ok) {
    throw new Error(`查询失败: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

async function downloadVideo(url, filename) {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`下载失败: ${response.status} ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    const filePath = path.join(downloadDir, filename);

    await fs.writeFile(filePath, Buffer.from(buffer));
    console.log(`✅ 下载成功: ${filename}`);
    return filePath;
  } catch (error) {
    console.error(`❌ 下载失败 ${filename}:`, error.message);
    return null;
  }
}

async function queryAndDownloadAll() {
  console.log("\n🔍 查询所有任务并下载已完成的视频");
  console.log("=" * 80);

  // 确保下载目录存在
  await ensureDownloadDir();

  // 1. 收集所有任务ID
  const allTaskIds = [
    // 您的序列视频任务
    "video_ba3a8df4-896b-490c-a5f2-8f2b9d87c771", // 镜头01
    "video_7313a80d-0cda-4658-8689-a050aeb0cc33", // 镜头02
    "video_621d3f0e-d61f-47eb-9473-47bc0f1caf98", // 镜头03
    "video_31364d26-8ecb-4fcb-8174-7386df9593fb", // 镜头04
    // 之前的测试任务
    "video_847a872a-6a7b-4396-8917-82397a7efc0d",
    "video_52080836-93f6-43c0-a8fa-a9dea63e30c3",
    "video_2b1ca211-e23d-4ce1-96b3-d90e07af3642"
  ];

  console.log(`\n📊 批量查询 ${allTaskIds.length} 个任务...`);

  // 2. 批量查询任务状态
  const results = await Promise.allSettled(
    allTaskIds.map(async (taskId) => {
      try {
        const response = await queryVideoStatus(taskId);
        return { id: taskId, status: response.status, data: response };
      } catch (error) {
        return { id: taskId, status: "error", error: String(error) };
      }
    })
  );

  // 3. 统计结果
  const completed = [];
  const processing = [];
  const pending = [];
  const failed = [];
  const errors = [];

  results.forEach((result) => {
    const taskId = result.value.id;
    if (result.status === "fulfilled") {
      const r = result.value;

      if (r.status === "completed") {
        completed.push({
          id: taskId,
          videoUrl: r.data.video_url,
          thumbnailUrl: r.data.thumbnail_url
        });
      } else if (r.status === "processing" || r.status === "in_progress") {
        processing.push(taskId);
      } else if (r.status === "pending" || r.status === "queued") {
        pending.push(taskId);
      } else if (r.status === "failed") {
        failed.push({ id: taskId, error: r.data.error });
      }
    } else {
      errors.push({ id: taskId, error: result.reason });
    }
  });

  // 4. 显示统计
  console.log("\n📊 任务统计:");
  console.log(`   ✅ 已完成: ${completed.length}`);
  console.log(`   🔄 处理中: ${processing.length}`);
  console.log(`   ⏳ 等待中: ${pending.length}`);
  console.log(`   ❌ 失败: ${failed.length}`);
  console.log(`   ⚠️ 查询错误: ${errors.length}`);

  // 5. 显示已完成的任务详情
  if (completed.length > 0) {
    console.log("\n✅ 已完成的任务:");
    completed.forEach((task, index) => {
      console.log(`\n${index + 1}. 任务ID: ${task.id}`);
      console.log(`   视频链接: ${task.videoUrl}`);
      if (task.thumbnailUrl) {
        console.log(`   缩略图: ${task.thumbnailUrl}`);
      }
    });
  }

  // 6. 下载已完成的视频
  if (completed.length > 0) {
    console.log("\n📥 开始下载已完成的视频...");

    const downloadResults = [];

    for (let i = 0; i < completed.length; i++) {
      const { id, videoUrl } = completed[i];

      // 生成更友好的文件名
      let filenamePrefix = `video_${id}`;
      if (id === "video_ba3a8df4-896b-490c-a5f2-8f2b9d87c771") filenamePrefix = "镜头01_马蹄特写";
      else if (id === "video_7313a80d-0cda-4658-8689-a050aeb0cc33") filenamePrefix = "镜头02_李建成骑马";
      else if (id === "video_621d3f0e-d61f-47eb-9473-47bc0f1caf98") filenamePrefix = "镜头03_李元吉骑马";
      else if (id === "video_31364d26-8ecb-4fcb-8174-7386df9593fb") filenamePrefix = "镜头04_两人并驾齐驱";

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").substring(0, 19);
      const filename = `${filenamePrefix}_${timestamp}.mp4`;

      console.log(`\n${i + 1}. 下载视频...`);
      const filePath = await downloadVideo(videoUrl, filename);

      if (filePath) {
        downloadResults.push({
          taskId: id,
          filename: filename,
          filePath: filePath,
          videoUrl: videoUrl
        });

        // 同时下载缩略图（如果存在）
        if (completed[i].thumbnailUrl) {
          const thumbFilename = `${filenamePrefix}_缩略图_${timestamp}.jpg`;
          await downloadVideo(completed[i].thumbnailUrl, thumbFilename);
        }
      }
    }

    // 7. 保存下载记录
    try {
      await fs.writeFile(
        path.join(downloadDir, "download-log.json"),
        JSON.stringify({
          timestamp: new Date().toISOString(),
          totalTasks: allTaskIds.length,
          completed: completed.length,
          downloaded: downloadResults.length,
          downloads: downloadResults
        }, null, 2)
      );

      console.log(`\n📁 下载记录已保存到: ${path.join(downloadDir, "download-log.json")}`);
      console.log(`\n✨ 下载完成！成功下载 ${downloadResults.length} 个视频到 ${downloadDir}`);
    } catch (error) {
      console.error("保存下载记录失败:", error.message);
    }
  } else {
    console.log("\n⏳ 暂无已完成的视频可下载");
    console.log("提示：您可以稍后重新运行此脚本检查下载");
  }

  // 8. 显示其他任务状态
  if (processing.length > 0 || pending.length > 0) {
    console.log("\n📋 其他任务状态:");

    if (processing.length > 0) {
      console.log("\n🔄 正在处理:");
      processing.forEach(id => console.log(`   - ${id}`));
    }

    if (pending.length > 0) {
      console.log("\n⏳ 等待中:");
      pending.forEach(id => console.log(`   - ${id}`));
    }

    if (failed.length > 0) {
      console.log("\n❌ 失败的任务:");
      failed.forEach(task => {
        console.log(`   - ${task.id}: ${task.error || "未知错误"}`);
      });
    }
  }
}

// 运行
async function main() {
  console.log("🎬 聚鑫视频批量查询和下载");
  console.log("=" * 80);

  try {
    await queryAndDownloadAll();
  } catch (error) {
    console.error("\n❌ 执行失败:", error.message);
  }
}

main().catch(console.error);