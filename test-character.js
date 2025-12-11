#!/usr/bin/env node

/**
 * 测试角色功能脚本
 */

import { JuxinApiClient } from "./dist/juxin-client.js";

const apiKey = "sk-Q6DwAtsNvutSlaZXYAzXR39pUmwKHAHDgll0QifCL5GbwJd7";
const client = new JuxinApiClient(apiKey);

async function testCharacterCreation() {
  console.log("\n🧪 测试角色创建功能");
  console.log("=" * 60);

  try {
    // 使用一个示例视频URL（实际使用时需要替换为真实的视频URL）
    const testVideoUrl = "https://filesystem.site/cdn/20251030/javYrU4etHVFDqg8by7mViTWHlMOZy.mp4";
    const timestamps = "1,3";

    console.log(`\n📹 创建角色...`);
    console.log(`视频URL: ${testVideoUrl}`);
    console.log(`时间戳: ${timestamps}`);

    const character = await client.createCharacter({
      url: testVideoUrl,
      timestamps: timestamps
    });

    console.log("\n✅ 角色创建成功！");
    console.log(`角色ID: ${character.id}`);
    console.log(`角色名称: ${character.username}`);
    console.log(`角色主页: ${character.permalink}`);
    console.log(`角色头像: ${character.profile_picture_url}`);

    console.log("\n💡 现在您可以在提示词中使用 @" + character.username + " 来创建包含这个角色的视频");

    return character;
  } catch (error) {
    console.error(`\n❌ 角色创建失败: ${error.message}`);
    return null;
  }
}

async function testCharacterVideo(character) {
  if (!character) {
    console.log("\n⚠️  由于角色创建失败，跳过角色视频测试");
    return;
  }

  console.log("\n🎬 测试角色视频创建");
  console.log("=" * 60);

  try {
    const response = await client.createVideo({
      prompt: `@${character.username} 在樱花树下散步，花瓣飘落，电影大片感`,
      orientation: "landscape",
      size: "small",
      duration: 15,
      watermark: false,
      private: true,
      images: [],
      character_url: character.profile_picture_url, // 这里使用角色头像作为示例
      character_timestamps: "1,3"
    });

    console.log(`\n✅ 角色视频创建成功！`);
    console.log(`任务ID: ${response.id}`);
    console.log(`状态: ${response.status}`);
    console.log(`\n💡 提示: 使用 query-single-task.js ${response.id} 查询生成进度`);
  } catch (error) {
    console.error(`\n❌ 角色视频创建失败: ${error.message}`);
  }
}

// 运行测试
async function main() {
  console.log("🎭 聚鑫MCP角色功能测试");
  console.log("=" * 80);

  const character = await testCharacterCreation();
  await testCharacterVideo(character);

  console.log("\n✨ 测试完成！");
}

main().catch(console.error);