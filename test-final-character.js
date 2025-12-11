#!/usr/bin/env node

/**
 * 最终的角色视频测试 - 使用正确的方式
 */

import { JuxinApiClient } from "./dist/juxin-client.js";

const apiKey = "sk-Q6DwAtsNvutSlaZXYAzXR39pUmwKHAHDgll0QifCL5GbwJd7";
const client = new JuxinApiClient(apiKey);

async function testFinalCharacter() {
  console.log("\n🎬 最终角色视频测试");
  console.log("=" * 80);
  console.log("根据文档分析，角色视频需要：");
  console.log("1. 使用已创建的角色名（如 @fpjhyfzxl.grandvizie）");
  console.log("2. 提示词中直接使用 @ 角色名");
  console.log("3. 可能需要特定的API端点");

  // 先尝试查询一下是否已经有这些角色
  console.log("\n🔍 检查角色是否存在...");

  // 测试1: 使用统一格式，不提供 character_url，只在提示词中使用 @
  console.log("\n🎬 测试1: 统一格式 - 仅在提示词中使用 @");
  try {
    const response = await client.createVideo({
      model: "sora-2",
      prompt: "@fpjhyfzxl.grandvizie 在宫殿中处理政务，身穿华丽朝服",
      orientation: "landscape",
      size: "small",
      duration: 15,
      watermark: false,
      private: true,
      images: []
      // 不提供 character_url 和 character_timestamps
    });

    console.log("✅ 成功!");
    console.log("   任务ID:", response.id);
    console.log("   模型:", response.model || "sora-2");
    console.log("   状态:", response.status);
  } catch (error) {
    console.error("❌ 失败:", error.message);
  }

  // 测试2: 使用 OpenAI 格式
  console.log("\n🎬 测试2: OpenAI 格式 - 使用 /v1/videos");
  try {
    const FormData = (await import("form-data")).default;
    const fs = await import("fs/promises");

    const form = new FormData();
    form.append("model", "sora-2");
    form.append("prompt", "@jasvwqpvt.hanblueher 在战场上英勇作战");
    form.append("seconds", "15");
    form.append("size", "16x9");
    form.append("watermark", "false");
    form.append("private", "true");

    // 创建临时文件作为 input_reference
    const tempFile = "temp.txt";
    await fs.writeFile(tempFile, "temp");
    form.append("input_reference", await fs.readFile(tempFile), {
      filename: "temp.txt",
      contentType: "text/plain"
    });
    await fs.unlink(tempFile);

    const response = await fetch("https://api.jxincm.cn/v1/videos", {
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
      console.log("✅ 成功!");
      console.log("   任务ID:", data.id);
      console.log("   模型:", data.model);
      console.log("   状态:", data.status);
    } else {
      console.error("❌ 失败:", data);
    }
  } catch (error) {
    console.error("❌ 失败:", error.message);
  }

  // 测试3: 尝试不同的模型名称
  console.log("\n🎬 测试3: 尝试 sora_video2 模型");
  try {
    const response = await fetch("https://api.jxincm.cn/v1/video/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "sora_video2",  // 尝试这个模型名
        prompt: "@rsgvoepwj.valor_knig 登基称帝，身穿龙袍",
        orientation: "landscape",
        size: "small",
        duration: 15,
        watermark: false,
        private: true,
        images: []
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log("✅ 成功!");
      console.log("   任务ID:", data.id);
      console.log("   模型:", data.model);
    } else {
      console.error("❌ 失败:", data);
    }
  } catch (error) {
    console.error("❌ 失败:", error.message);
  }

  // 测试4: 使用聊天格式
  console.log("\n🎬 测试4: 聊天格式 - /v1/chat/completions");
  try {
    const response = await fetch("https://api.jxincm.cn/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "sora-2",
        messages: [
          {
            role: "user",
            content: "@fpjhyfzxl.grandvizie and @jasvwqpvt.hanblueher riding horses together"
          }
        ],
        stream: false
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log("✅ 成功!");
      console.log("   响应:", JSON.stringify(data, null, 2));
    } else {
      console.error("❌ 失败:", data);
    }
  } catch (error) {
    console.error("❌ 失败:", error.message);
  }
}

// 运行测试
async function main() {
  console.log("🏛️  聚鑫API角色视频完整测试");
  console.log("=" * 80);

  await testFinalCharacter();

  console.log("\n✨ 测试完成！");
  console.log("\n📌 总结:");
  console.log("1. 如果某些格式成功，说明需要使用特定的API端点");
  console.log("2. veo2-fast 错误可能是因为API检测到@符号后的路由逻辑");
  console.log("3. 可能需要联系API提供商确认角色视频的正确使用方式");
}

main().catch(console.error);