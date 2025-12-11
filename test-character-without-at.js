#!/usr/bin/env node

/**
 * 测试不使用@符号的角色视频
 */

import { JuxinApiClient } from "./dist/juxin-client.js";

const apiKey = "sk-Q6DwAtsNvutSlaZXYAzXR39pUmwKHAHDgll0QifCL5GbwJd7";
const client = new JuxinApiClient(apiKey);

async function testWithoutAtSymbol() {
  console.log("\n🧪 测试不使用@符号的角色视频");
  console.log("=" * 80);

  // 测试1: 不使用@符号，直接描述角色
  console.log("\n测试1: 直接描述角色（不使用@符号）");
  try {
    const response = await client.createVideo({
      prompt: "A character named Li Jiancheng riding slowly on a horse, wearing light robes instead of armor, expression relaxed, 2D vector art, stick figure characters with round heads, clear black ink outlines, Chinese ink wash aesthetic",
      orientation: "landscape",
      size: "small",
      duration: 15,
      watermark: false,
      private: true,
      images: []
    });
    console.log("✅ 成功! 任务ID:", response.id);
  } catch (error) {
    console.error("❌ 失败:", error.message);
  }

  // 测试2: 使用@符号但放在引号内
  console.log("\n测试2: @符号放在引号内");
  try {
    const response = await client.createVideo({
      prompt: "The character '@fpjhyfzxl.grandvizie' riding slowly on a horse",
      orientation: "landscape",
      size: "small",
      duration: 15,
      watermark: false,
      private: true,
      images: []
    });
    console.log("✅ 成功! 任务ID:", response.id);
  } catch (error) {
    console.error("❌ 失败:", error.message);
  }

  // 测试3: 尝试不同的模型
  console.log("\n测试3: 尝试不指定模型（看API默认值）");
  try {
    // 创建临时请求不包含model
    const response = await fetch("https://api.jxincm.cn/v1/video/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        prompt: "@fpjhyfzxl.grandvizie riding on a horse",
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
      console.log("✅ 成功! 任务ID:", data.id);
      console.log("   返回模型:", data.model);
    } else {
      console.error("❌ 失败:", data);
    }
  } catch (error) {
    console.error("❌ 失败:", error.message);
  }
}

testWithoutAtSymbol();