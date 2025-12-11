#!/usr/bin/env node

/**
 * 查询所有任务并下载已完成的视频
 */

import { JuxinApiClient } from "./dist/juxin-client.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const apiKey = "sk-Q6DwAtsNvutSlaZXYAzXR39pUmwKHAHDgll0QifCL5GbwJd7";
const client = new JuxinApiClient(apiKey);

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

  // 1. 首先尝试读取sequence-tasks-final.json中的任务ID
  const sequenceTaskIds = [
    "video_ba3a8df4-896b-490c-a5f2-8f2b9d87c771",
    "video_7313a80d-0cda-4658-8689-a050aeb0cc33",
    "video_621d3f0e-d61f-47eb-9473-47bc0f1caf98",
    "video_31364d26-8ecb-4fcb-8174-7386df9593fb"
  ];

  // 2. 也尝试读取tasks.json中的任务
  let allTaskIds = [...sequenceTaskIds];

  try {
    const tasksData = await fs.readFile("tasks.json", "utf-8");
    const tasks = JSON.parse(tasksData);
    const taskIds = tasks.map(t => t.id);
    allTaskIds = [...new Set([...allTaskIds, ...taskIds])]; // 去重
    console.log(`\n📋 找到 ${allTaskIds.length} 个任务ID`);
  } catch (error) {
    console.log("\n⚠️ 无法读取tasks.json，仅使用序列任务ID");
  }

  console.log(`\n📊 批量查询 ${allTaskIds.length} 个任务...`);

  // 3. 批量查询任务状态
  const results = await Promise.allSettled(
    allTaskIds.map(async (taskId) => {
      try {
        const response = await client.queryVideoStatus({ id: taskId });
        return { id: taskId, status: response.status, data: response };
      } catch (error) {
        return { id: taskId, status: "error", error: String(error) };
      }
    })
  );

  // 4. 统计结果
  const completed = [];
  const processing = [];
  const pending = [];
  const failed = [];
  const errors = [];

  results.forEach((result, index) => {
    const taskId = allTaskIds[index];
    if (result.status === "fulfilled") {
      const r = result.value;

      if (r.status === "completed") {
        completed.push({ id: taskId, videoUrl: r.data.video_url });
      } else if (r.status === "processing") {
        processing.push(taskId);
      } else if (r.status === "pending" || r.status === "queued") {
        pending.push(taskId);
      } else if (r.status === "failed") {
        failed.push(taskId);
      }
    } else {
      errors.push({ id: taskId, error: result.reason });
    }
  });

  // 5. 显示统计
  console.log("\n📊 任务统计:");
  console.log(`   ✅ 已完成: ${completed.length}`);
  console.log(`   🔄 处理中: ${processing.length}`);
  console.log(`   ⏳ 等待中: ${pending.length}`);
  console.log(`   ❌ 失败: ${failed.length}`);
  console.log(`   ⚠️ 查询错误: ${errors.length}`);

  // 6. 下载已完成的视频
  if (completed.length > 0) {
    console.log("\n📥 开始下载已完成的视频...");

    const downloadResults = [];

    for (let i = 0; i < completed.length; i++) {
      const { id, videoUrl } = completed[i];

      // 生成文件名
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `video_${id}_${timestamp}.mp4`;

      console.log(`\n${i + 1}. 下载视频 ${id}...`);
      const filePath = await downloadVideo(videoUrl, filename);

      if (filePath) {
        downloadResults.push({
          taskId: id,
          filename: filename,
          filePath: filePath,
          videoUrl: videoUrl
        });
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
    } catch (error) {
      console.error("保存下载记录失败:", error.message);
    }

    console.log(`\n✨ 下载完成！成功下载 ${downloadResults.length} 个视频到 ${downloadDir}`);
  } else {
    console.log("\n⏳ 暂无已完成的视频可下载");
  }

  // 8. 显示处理中的任务
  if (processing.length > 0) {
    console.log("\n🔄 正在处理的任务:");
    processing.forEach(id => console.log(`   - ${id}`));
  }

  if (pending.length > 0) {
    console.log("\n⏳ 等待中的任务:");
    pending.forEach(id => console.log(`   - ${id}`));
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