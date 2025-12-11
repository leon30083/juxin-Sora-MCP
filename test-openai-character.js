#!/usr/bin/env node

/**
 * 使用OpenAI官方格式测试角色视频
 * 使用 /v1/videos 端点和 multipart/form-data
 */

import FormData from "form-data";
import fs from "fs/promises";

const apiKey = "sk-Q6DwAtsNvutSlaZXYAzXR39pUmwKHAHDgll0QifCL5GbwJd7";
const baseUrl = "https://api.jxincm.cn";

async function testOpenAICharacterFormat() {
  console.log("\n🎬 测试OpenAI官方格式的角色视频");
  console.log("=" * 80);
  console.log("使用 /v1/videos 端点，multipart/form-data 格式");

  // 测试1: 使用您提供的角色名在提示词中
  console.log("\n🎬 测试1: 李建成骑马");
  try {
    const form = new FormData();
    form.append("model", "sora-2");
    form.append("prompt", "@fpjhyfzxl.grandvizie riding slowly on a horse, wearing light robes instead of armor, expression relaxed");
    form.append("seconds", "15");
    form.append("size", "16x9");
    form.append("watermark", "false");
    form.append("private", "true");

    // character_url 和 character_timestamps 是可选的
    // 如果不提供，API会根据提示词中的 @ 字符识别角色
    form.append("character_url", "https://filesystem.site/cdn/20251030/javYrU4etHVFDqg8by7mViTWHlMOZy.mp4");
    form.append("character_timestamps", "2,4");

    // input_reference 是必需的，即使没有图片
    // 创建一个临时空文件
    const tempFile = "temp-placeholder.txt";
    await fs.writeFile(tempFile, "placeholder");
    form.append("input_reference", await fs.readFile(tempFile), {
      filename: "placeholder.txt",
      contentType: "text/plain"
    });
    await fs.unlink(tempFile);

    const response = await fetch(`${baseUrl}/v1/videos`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        ...form.getHeaders()
      },
      body: form
    });

    const data = await response.json();

    if (response.ok) {
      console.log("✅ 成功创建角色视频!");
      console.log("   任务ID:", data.id);
      console.log("   模型:", data.model);
      console.log("   状态:", data.status);

      // 保存任务ID
      await fs.appendFile("openai-character-tasks.txt",
        `李建成骑马 (${data.model}): ${data.id}\n`);
    } else {
      console.error("❌ 失败:", data);
    }
  } catch (error) {
    console.error("❌ 错误:", error.message);
  }

  // 测试2: 李元吉射箭
  console.log("\n🎬 测试2: 李元吉射箭");
  try {
    const form = new FormData();
    form.append("model", "sora-2");
    form.append("prompt", "@jasvwqpvt.hanblueher carrying a bow, looking forward, clear ink lines, Chinese ink wash style");
    form.append("seconds", "15");
    form.append("size", "16x9");
    form.append("watermark", "false");
    form.append("private", "true");

    const tempFile = "temp-placeholder.txt";
    await fs.writeFile(tempFile, "placeholder");
    form.append("input_reference", await fs.readFile(tempFile), {
      filename: "placeholder.txt",
      contentType: "text/plain"
    });
    await fs.unlink(tempFile);

    const response = await fetch(`${baseUrl}/v1/videos`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        ...form.getHeaders()
      },
      body: form
    });

    const data = await response.json();

    if (response.ok) {
      console.log("✅ 成功创建角色视频!");
      console.log("   任务ID:", data.id);
      console.log("   模型:", data.model);

      await fs.appendFile("openai-character-tasks.txt",
        `李元吉射箭 (${data.model}): ${data.id}\n`);
    } else {
      console.error("❌ 失败:", data);
    }
  } catch (error) {
    console.error("❌ 错误:", error.message);
  }

  // 测试3: 两人并驾齐驱
  console.log("\n🎬 测试3: 两人并驾齐驱");
  try {
    const form = new FormData();
    form.append("model", "sora-2");
    form.append("prompt", "@fpjhyfzxl.grandvizie and @jasvwqpvt.hanblueher riding side by side, robes fluttering in the morning breeze");
    form.append("seconds", "15");
    form.append("size", "16x9");
    form.append("watermark", "false");
    form.append("private", "true");

    const tempFile = "temp-placeholder.txt";
    await fs.writeFile(tempFile, "placeholder");
    form.append("input_reference", await fs.readFile(tempFile), {
      filename: "placeholder.txt",
      contentType: "text/plain"
    });
    await fs.unlink(tempFile);

    const response = await fetch(`${baseUrl}/v1/videos`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        ...form.getHeaders()
      },
      body: form
    });

    const data = await response.json();

    if (response.ok) {
      console.log("✅ 成功创建角色视频!");
      console.log("   任务ID:", data.id);
      console.log("   模型:", data.model);

      await fs.appendFile("openai-character-tasks.txt",
        `两人并驾齐驱 (${data.model}): ${data.id}\n`);
    } else {
      console.error("❌ 失败:", data);
    }
  } catch (error) {
    console.error("❌ 错误:", error.message);
  }

  console.log("\n📋 OpenAI格式角色视频说明:");
  console.log("1. 使用 /v1/videos 端点（不是 /v1/video/create）");
  console.log("2. 使用 multipart/form-data 格式（不是 JSON）");
  console.log("3. 必须包含 input_reference 字段（即使是占位符）");
  console.log("4. 在提示词中使用 @角色名 格式");
  console.log("5. seconds 是字符串类型");
}

// 运行测试
async function main() {
  console.log("🏛️  OpenAI官方格式角色视频测试");
  console.log("=" * 80);

  // 检查是否有 form-data
  try {
    await import("form-data");
  } catch {
    console.error("\n❌ 缺少 form-data 依赖");
    console.log("请运行: npm install form-data");
    process.exit(1);
  }

  await testOpenAICharacterFormat();

  console.log("\n✨ 测试完成！");
  console.log("\n📌 后续操作:");
  console.log("1. 查看 openai-character-tasks.txt 文件");
  console.log("2. 使用查询API检查任务状态");
}

main().catch(console.error);