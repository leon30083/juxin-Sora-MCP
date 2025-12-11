#!/usr/bin/env node

/**
 * 简单测试聊天格式角色视频
 * 直接使用API，不依赖编译后的客户端
 */

const apiKey = "sk-Q6DwAtsNvutSlaZXYAzXR39pUmwKHAHDgll0QifCL5GbwJd7";

async function testChatCharacter() {
  console.log("\n🎬 测试聊天格式角色视频创建");
  console.log("=" * 80);

  const prompt = "@fpjhyfzxl.grandvizie 在宫殿中漫步，身穿华丽朝服";

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
            content: prompt
          }
        ],
        stream: false
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log("✅ 成功!");
      console.log("\n完整响应:");
      console.log(JSON.stringify(data, null, 2));

      if (data.choices && data.choices[0] && data.choices[0].message) {
        const content = data.choices[0].message.content;
        console.log("\n响应内容:");
        console.log(content);

        // 查找下载链接
        const match = content.match(/\[download video\]\((https:\/\/[^)]+)\)/);
        if (match && match[1]) {
          console.log("\n✨ 找到视频链接:");
          console.log(match[1]);
        } else {
          console.log("\n⚠️ 未找到视频链接");
        }
      }
    } else {
      console.error("❌ 失败:", data);
    }
  } catch (error) {
    console.error("❌ 错误:", error.message);
  }
}

testChatCharacter();