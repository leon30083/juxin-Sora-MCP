#!/usr/bin/env node

/**
 * MCP 工具使用演示
 * 模拟在 Claude 中使用 MCP 工具生成视频的过程
 */

import { JuxinApiClient } from "./dist/juxin-client.js";

// 设置 API 密钥
const apiKey = "sk-Q6DwAtsNvutSlaZXYAzXR39pUmwKHAHDgll0QifCL5GbwJd7";
const client = new JuxinApiClient(apiKey);

// 模拟 MCP 工具：create_video
async function createVideo(params) {
  console.log("\n🎬 [MCP工具] create_video");
  console.log(`参数: ${JSON.stringify(params, null, 2)}\n`);

  const createRequest = {
    images: params.images || [],
    model: "sora-2",
    orientation: params.orientation || "portrait",
    prompt: params.prompt,
    size: params.size || "small",
    duration: params.duration || 10,
    watermark: params.watermark !== false,
    private: params.private !== false
  };

  const response = await client.createVideo(createRequest);

  return {
    success: true,
    task_id: response.id,
    status: response.status,
    message: `✅ 视频创建成功！\n\n任务ID: ${response.id}\n初始状态: ${response.status}\n\n你可以使用 query_video_status 工具查询生成进度。`
  };
}

// 模拟 MCP 工具：query_video_status
async function queryVideoStatus(params) {
  console.log("\n🔍 [MCP工具] query_video_status");
  console.log(`参数: ${JSON.stringify(params, null, 2)}\n`);

  const response = await client.queryVideoStatus({ id: params.task_id });

  let statusText = "";
  let videoUrl = "";
  let thumbnailUrl = "";

  switch (response.status) {
    case "pending":
    case "queued":
      const progress = response.detail?.pending_info?.progress_pct || 0;
      statusText = `⏳ 等待中\n进度: ${Math.round(progress * 100)}%`;
      break;

    case "processing":
      statusText = "🔄 正在生成视频中...";
      break;

    case "completed":
      statusText = "✅ 生成完成";
      videoUrl = response.video_url;
      thumbnailUrl = response.thumbnail_url || "";
      break;

    case "failed":
      statusText = `❌ 生成失败${response.error ? ": " + response.error : ""}`;
      break;
  }

  const updateTime = response.status_update_time || Date.now();
  const responseText = `任务状态: ${statusText}\n最后更新: ${new Date(updateTime).toLocaleString()}`;

  return {
    success: true,
    task_id: params.task_id,
    status: response.status,
    message: responseText,
    video_url: videoUrl,
    thumbnail_url: thumbnailUrl
  };
}

// 主演示流程
async function demo() {
  console.log("🤖 模拟 Claude 使用 MCP 工具生成视频\n");
  console.log("=" .repeat(50));

  // 步骤1：创建视频
  console.log("\n👤 用户: 请帮我创建一个视频：一只可爱的小猫在樱花树下玩耍，动漫风格，竖屏格式");

  const videoParams = {
    prompt: "一只可爱的小猫在樱花树下玩耍，动漫风格",
    orientation: "portrait",
    size: "small",
    watermark: true,
    private: true
  };

  const createResult = await createVideo(videoParams);
  console.log(`🤖 Claude: ${createResult.message}`);
  console.log(`任务ID: ${createResult.task_id}`);

  // 步骤2：查询状态
  console.log("\n👤 用户: 查询一下视频生成进度");

  const taskId = createResult.task_id;
  const queryResult = await queryVideoStatus({ task_id: taskId });
  console.log(`🤖 Claude: ${queryResult.message}`);

  // 如果视频还在生成，再次查询
  if (queryResult.status === "queued" || queryResult.status === "pending" || queryResult.status === "processing") {
    console.log("\n👤 用户: 再查询一次看看");

    // 等待几秒
    console.log("\n⏳ 等待5秒后再次查询...");
    await new Promise(resolve => setTimeout(resolve, 5000));

    const queryResult2 = await queryVideoStatus({ task_id: taskId });
    console.log(`🤖 Claude: ${queryResult2.message}`);

    // 如果完成了，显示视频链接
    if (queryResult2.video_url) {
      console.log(`\n🎉 视频生成完成！视频链接: ${queryResult2.video_url}`);
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log("\n💡 提示：");
  console.log("1. 视频生成通常需要1-10分钟");
  console.log("2. 你可以使用 wait_for_completion: true 来等待完成");
  console.log("3. 生成的视频会自动下载，可以保存或分享");
}

// 运行演示
demo().catch(console.error);