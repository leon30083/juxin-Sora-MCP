#!/usr/bin/env node

/**
 * 调试API请求，查看实际发送的内容
 */

import { JuxinApiClient } from "./dist/juxin-client.js";

const apiKey = "sk-Q6DwAtsNvutSlaZXYAzXR39pUmwKHAHDgll0QifCL5GbwJd7";

// 创建一个自定义客户端来记录请求
class DebugJuxinApiClient extends JuxinApiClient {
  async createVideo(request) {
    console.log("\n🔍 发送的请求内容:");
    console.log(JSON.stringify(request, null, 2));
    console.log("\n🔗 请求URL:", `${this.baseUrl}/v1/video/create`);
    console.log("\n📋 Headers:");
    console.log("  Content-Type: application/json");
    console.log("  Accept: application/json");
    console.log(`  Authorization: Bearer ${this.apiKey.substring(0, 10)}...`);

    try {
      const response = await fetch(`${this.baseUrl}/v1/video/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(request)
      });

      console.log("\n📤 响应状态:", response.status, response.statusText);

      const responseText = await response.text();
      console.log("\n📥 响应内容:", responseText);

      // 尝试解析为JSON
      try {
        return JSON.parse(responseText);
      } catch {
        throw new Error(`API错误 (${response.status}): ${responseText}`);
      }
    } catch (error) {
      console.error("\n❌ 请求失败:", error);
      throw error;
    }
  }
}

const debugClient = new DebugJuxinApiClient(apiKey);

async function testDebug() {
  console.log("🐛 API请求调试");
  console.log("=" * 60);

  const testRequest = {
    prompt: "a cat walking under cherry blossoms",
    model: "sora-2",
    orientation: "landscape",
    size: "small",
    duration: 15,
    watermark: false,
    private: true,
    images: []
  };

  try {
    await debugClient.createVideo(testRequest);
  } catch (error) {
    console.error("\n最终错误:", error.message);
  }
}

testDebug();