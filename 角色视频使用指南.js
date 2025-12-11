#!/usr/bin/env node

/**
 * 角色视频使用指南和示例
 * 展示如何正确使用角色视频功能
 */

console.log("📚 聚鑫MCP角色视频功能使用指南");
console.log("=" * 80);

console.log("\n1️⃣ 角色视频功能概述");
console.log("-" * 40);
console.log("聚鑫MCP支持两种角色视频创建方式：");
console.log("");
console.log("a) 使用现有角色ID（已提供）");
console.log("   - 李建成: @fpjhyfzxl.grandvizie");
console.log("   - 李元吉: @jasvwqpvt.hanblueher");
console.log("   - 李世民: @rsgvoepwj.valor_knig");
console.log("");
console.log("b) 从视频创建新角色");
console.log("   - 使用 create_character 工具");
console.log("   - 提供视频URL和时间戳");

console.log("\n2️⃣ 使用现有角色创建视频");
console.log("-" * 40);
console.log("");
console.log("MCP工具调用示例：");
console.log(`{
  "name": "create_video",
  "arguments": {
    "prompt": "@fpjhyfzxl.grandvizie 在宫殿中处理政务，身穿朝服",
    "orientation": "landscape",
    "size": "small",
    "duration": 15,
    "watermark": false,
    "private": true
  }
}`);

console.log("\n3️⃣ 序列视频创建（用户提供的格式）");
console.log("-" * 40);
console.log("");
console.log("序列配置示例：");
console.log(`{
  "sequence_id": "Xuanwu-Part2-Entry",
  "total_duration": 14.0,
  "style": "2D vector art, stick figure characters with round heads, clear black ink outlines, Chinese ink wash aesthetic",
  "shots": [
    {
      "shot_id": "01",
      "duration": 2.0,
      "camera": "Close Up",
      "action": "Horse hooves stepping on stone bricks"
    },
    {
      "shot_id": "02",
      "duration": 4.0,
      "camera": "Side Profile",
      "action": "@fpjhyfzxl.grandvizie riding slowly"
    }
  ]
}`);

console.log("\n4️⃣ 批量任务管理");
console.log("-" * 40);
console.log("");
console.log("查询多个任务状态：");
console.log(`{
  "name": "query_all_videos",
  "arguments": {
    "task_ids": ["task1", "task2", "task3"]
  }
}`);

console.log("\n列出所有任务：");
console.log(`{
  "name": "list_tasks",
  "arguments": {
    "limit": 20,
    "status": "all"
  }
}`);

console.log("\n5️⃣ 创建新角色（当需要自定义角色时）");
console.log("-" * 40);
console.log("");
console.log("MCP工具调用示例：");
console.log(`{
  "name": "create_character",
  "arguments": {
    "url": "https://example.com/video.mp4",
    "timestamps": "1,3"
  }
}`);

console.log("\n响应示例：");
console.log(`{
  "id": "ch_6918d62178e48191a0b1ae49be428a13",
  "username": "角色名",
  "permalink": "https://sora.chatgpt.com/profile/角色名",
  "profile_picture_url": "角色头像URL"
}`);

console.log("\n6️⃣ 当前API状态");
console.log("-" * 40);
console.log("");
console.log("⚠️ 当前API返回错误：");
console.log("'No available channels for model veo2-fast in group 限时特价'");
console.log("");
console.log("可能原因：");
console.log("1. API服务暂时不可用");
console.log("2. 当前套餐组配额已用完");
console.log("3. 需要使用不同的认证方式");

console.log("\n7️⃣ 测试脚本说明");
console.log("-" * 40);
console.log("");
console.log("已创建的测试脚本：");
console.log("");
console.log("• test-character-sequence.js");
console.log("  - 测试您提供的角色序列视频");
console.log("  - 包含4个镜头的李建成和李元吉骑马场景");
console.log("");
console.log("• test-provided-characters.js");
console.log("  - 测试所有提供的角色ID");
console.log("  - 为每个角色创建一个测试视频");
console.log("");
console.log("• query-sequence.js（自动生成）");
console.log("  - 批量查询序列任务状态");
console.log("");
console.log("• sequence-tasks.json（自动生成）");
console.log("  - 保存序列任务信息");

console.log("\n8️⃣ 最佳实践");
console.log("-" * 40);
console.log("");
console.log("1. 使用 @角色名 格式在提示词中引用角色");
console.log("2. 提供清晰的场景描述和动作指令");
console.log("3. 使用批量查询工具管理多个任务");
console.log("4. 保存任务ID以便后续跟踪");
console.log("5. 定期使用 list_tasks 查看整体进度");

console.log("\n9️⃣ 故障排除");
console.log("-" * 40);
console.log("");
console.log("如果遇到API错误：");
console.log("1. 等待一段时间后重试");
console.log("2. 检查API密钥是否有效");
console.log("3. 联系API提供商确认服务状态");
console.log("4. 考虑升级到不同的套餐组");

console.log("\n✨ 准备就绪！");
console.log("-" * 40);
console.log("一旦API服务恢复，您可以：");
console.log("1. 运行 node test-character-sequence.js 创建角色视频");
console.log("2. 使用 node query-sequence.js 查询进度");
console.log("3. 下载完成的视频到工作区");

console.log("\n" + "=" * 80);