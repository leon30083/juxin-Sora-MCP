#!/usr/bin/env node

/**
 * 使用正确的角色视频格式测试
 * 使用 character_url 和 character_timestamps 参数
 */

import { JuxinApiClient } from "./dist/juxin-client.js";

const apiKey = "sk-Q6DwAtsNvutSlaZXYAzXR39pUmwKHAHDgll0QifCL5GbwJd7";
const client = new JuxinApiClient(apiKey);

// 角色视频创建需要使用 character_url 和 character_timestamps
// 而不是在 prompt 中使用 @ 符号
async function testCorrectCharacterFormat() {
  console.log("\n✅ 使用正确的角色视频格式测试");
  console.log("=" * 80);
  console.log("说明: 角色视频需要使用 character_url 和 character_timestamps 参数");
  console.log("而不是在 prompt 中使用 @ 符号");

  // 测试1: 使用示例视频URL
  console.log("\n🎬 测试1: 李建成骑马场景");
  try {
    const response = await client.createVideo({
      model: "sora-2",
      prompt: "Li Jiancheng riding slowly on a horse, wearing light robes, expression relaxed, 2D vector art style",
      orientation: "landscape",
      size: "small",
      duration: 15,
      watermark: false,
      private: true,
      images: [],
      // 使用角色参数而不是在提示词中使用@
      character_url: "https://filesystem.site/cdn/20251030/javYrU4etHVFDqg8by7mViTWHlMOZy.mp4",
      character_timestamps: "2,4"
    });

    console.log("✅ 成功创建角色视频!");
    console.log("   任务ID:", response.id);
    console.log("   模型:", response.model || "sora-2");

    // 保存任务ID
    const fs = await import("fs/promises");
    await fs.appendFile("correct-character-tasks.txt",
      `李建成骑马: ${response.id}\n`);
  } catch (error) {
    console.error("❌ 失败:", error.message);
  }

  // 测试2: 另一个场景
  console.log("\n🎬 测试2: 李元吉射箭场景");
  try {
    const response = await client.createVideo({
      model: "sora-2",
      prompt: "Li Yuanji carrying a bow and looking forward, 2D vector art with ink wash aesthetic",
      orientation: "landscape",
      size: "small",
      duration: 15,
      watermark: false,
      private: true,
      images: [],
      character_url: "https://filesystem.site/cdn/20251030/javYrU4etHVFDqg8by7mViTWHlMOZy.mp4",
      character_timestamps: "1,3"
    });

    console.log("✅ 成功创建角色视频!");
    console.log("   任务ID:", response.id);

    const fs = await import("fs/promises");
    await fs.appendFile("correct-character-tasks.txt",
      `李元吉射箭: ${response.id}\n`);
  } catch (error) {
    console.error("❌ 失败:", error.message);
  }

  // 测试3: 两人并排
  console.log("\n🎬 测试3: 两人并驾齐驱");
  try {
    const response = await client.createVideo({
      model: "sora-2",
      prompt: "Two characters riding side by side on horses, robes fluttering in the breeze, historical Chinese style",
      orientation: "landscape",
      size: "small",
      duration: 15,
      watermark: false,
      private: true,
      images: [],
      character_url: "https://filesystem.site/cdn/20251030/javYrU4etHVFDqg8by7mViTWHlMOZy.mp4",
      character_timestamps: "2,5"
    });

    console.log("✅ 成功创建角色视频!");
    console.log("   任务ID:", response.id);

    const fs = await import("fs/promises");
    await fs.appendFile("correct-character-tasks.txt",
      `两人并驾齐驱: ${response.id}\n`);
  } catch (error) {
    console.error("❌ 失败:", error.message);
  }

  console.log("\n📋 角色视频正确格式说明:");
  console.log("1. 不在提示词中使用 @ 符号");
  console.log("2. 使用 character_url 参数指定包含角色的视频");
  console.log("3. 使用 character_timestamps 指定角色出现的时间段");
  console.log("4. 时间戳格式: '开始秒,结束秒' (范围1-3秒)");
}

// 运行测试
async function main() {
  console.log("🏛️  正确的角色视频格式测试");
  console.log("=" * 80);

  await testCorrectCharacterFormat();

  console.log("\n✨ 测试完成！");
  console.log("\n📌 后续操作:");
  console.log("1. 使用 'node query-single-task.js <task-id>' 查询任务状态");
  console.log("2. 查看生成的 correct-character-tasks.txt 文件");
}

main().catch(console.error);