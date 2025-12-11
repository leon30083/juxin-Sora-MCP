#!/usr/bin/env node

/**
 * 测试角色序列视频 - 使用正确的方法
 * 基于成功的测试：仅在提示词中使用 @ 角色名
 */

import { JuxinApiClient } from "./dist/juxin-client.js";
import fs from "fs/promises";

const apiKey = "sk-Q6DwAtsNvutSlaZXYAzXR39pUmwKHAHDgll0QifCL5GbwJd7";
const client = new JuxinApiClient(apiKey);

// 用户提供的视频序列配置
const videoSequence = {
  "sequence_id": "Xuanwu-Part2-Entry",
  "total_duration": 14.0,
  "style": "2D vector art, stick figure characters with round heads, clear black ink outlines, Chinese ink wash aesthetic, parchment paper background, minimalist and expressive animation, historical documentary style",
  "shots": [
    {
      "shot_id": "01",
      "duration": 2.0,
      "camera": "Close Up",
      "action": "Horse hooves stepping rhythmically on the stone bricks, dust rising slightly"
    },
    {
      "shot_id": "02",
      "duration": 4.0,
      "camera": "Side Profile",
      "action": "@fpjhyfzxl.grandvizie riding slowly, clear ink lines, wearing light robes instead of armor, expression relaxed"
    },
    {
      "shot_id": "03",
      "duration": 4.0,
      "camera": "Side Profile",
      "action": "@jasvwqpvt.hanblueher riding alongside, clear ink lines, carrying a simple bow, looking forward casually"
    },
    {
      "shot_id": "04",
      "duration": 4.0,
      "camera": "Medium Shot",
      "action": "@fpjhyfzxl.grandvizie and @jasvwqpvt.hanblueher riding side by side, robes fluttering gently in the morning breeze"
    }
  ]
};

async function testCharacterSequence() {
  console.log("\n🎬 角色序列视频创建 - 正确方法");
  console.log("=" * 80);
  console.log(`序列ID: ${videoSequence.sequence_id}`);
  console.log(`总时长: ${videoSequence.total_duration}秒`);
  console.log(`风格: ${videoSequence.style}`);

  const taskIds = [];
  const results = [];

  // 为每个镜头创建视频任务
  for (const shot of videoSequence.shots) {
    console.log(`\n🎥 创建镜头 ${shot.shot_id}: ${shot.camera}`);
    console.log(`   动作: ${shot.action}`);

    // 构建完整的提示词
    const prompt = `${videoSequence.style}, ${shot.camera} shot, ${shot.action}`;

    try {
      const response = await client.createVideo({
        model: "sora-2",
        prompt: prompt,
        orientation: "landscape",
        size: "small",
        duration: 15, // 使用15秒
        watermark: false,
        private: true,
        images: []
        // 不需要 character_url 和 character_timestamps
        // 直接在提示词中使用 @ 角色名
      });

      taskIds.push({
        shot_id: shot.shot_id,
        task_id: response.id
      });

      results.push(`✅ 镜头${shot.shot_id}: ${response.id}`);
      console.log(`   ✅ 成功，任务ID: ${response.id}`);
    } catch (error) {
      console.error(`   ❌ 失败: ${error.message}`);
      results.push(`❌ 镜头${shot.shot_id}: ${error.message}`);
    }
  }

  // 保存结果
  try {
    await fs.writeFile("sequence-results.txt", results.join("\n"));
    await fs.writeFile("sequence-tasks-final.json", JSON.stringify({
      sequence_id: videoSequence.sequence_id,
      created_at: new Date().toISOString(),
      tasks: taskIds
    }, null, 2));

    console.log("\n📁 结果已保存:");
    console.log("   - sequence-results.txt: 简单列表");
    console.log("   - sequence-tasks-final.json: 详细信息");
  } catch (error) {
    console.error("\n⚠️ 保存失败:", error.message);
  }

  // 显示汇总
  console.log("\n📊 创建汇总:");
  const success = taskIds.filter(t => t.task_id).length;
  console.log(`   总镜头数: ${videoSequence.shots.length}`);
  console.log(`   成功创建: ${success}`);
  console.log(`   创建失败: ${videoSequence.shots.length - success}`);

  if (success > 0) {
    console.log("\n💡 查询指令:");
    console.log("   查询单个任务:");
    taskIds.forEach(task => {
      if (task.task_id) {
        console.log(`   node query-single-task.js ${task.task_id} # 镜头${task.shot_id}`);
      }
    });

    // 创建批量查询脚本
    const successfulIds = taskIds.filter(t => t.task_id).map(t => t.task_id);
    if (successfulIds.length > 0) {
      const batchScript = `#!/usr/bin/env node
import { JuxinApiClient } from "./dist/juxin-client.js";

const client = new JuxinApiClient("sk-Q6DwAtsNvutSlaZXYAzXR39pUmwKHAHDgll0QifCL5GbwJd7");
const taskIds = ${JSON.stringify(successfulIds)};

async function queryAll() {
  console.log("\\n🔍 批量查询序列任务状态");
  console.log("=" * 60);

  for (let i = 0; i < taskIds.length; i++) {
    const taskId = taskIds[i];
    console.log(\`\\n\${i + 1}. 任务 \${taskId}:\`);

    try {
      const response = await client.queryVideoStatus({ id: taskId });
      console.log(\`   状态: \${response.status}\`);

      if (response.status === "completed") {
        console.log(\`   视频: \${response.video_url}\`);
      }
    } catch (error) {
      console.log(\`   查询失败: \${error.message}\`);
    }
  }
}

queryAll();
`;

      try {
        await fs.writeFile("query-sequence-final.js", batchScript);
        console.log("\n   已创建批量查询脚本:");
        console.log("   node query-sequence-final.js");
      } catch (error) {
        console.error("   创建查询脚本失败:", error.message);
      }
    }
  }
}

// 运行测试
async function main() {
  console.log("🏛️  玄武篇第二部 - 角色序列视频");
  console.log("=" * 80);
  console.log("使用正确的角色视频格式");
  console.log("提示词中直接使用 @ 角色名，无需额外参数");

  await testCharacterSequence();

  console.log("\n✨ 完成！");
  console.log("\n📌 关键发现:");
  console.log("1. ✅ 成功使用 @fpjhyfzxl.grandvizie 创建角色视频");
  console.log("2. ✅ 使用 /v1/video/create 端点");
  console.log("3. ✅ model: 'sora-2'");
  console.log("4. ❌ 不需要在请求中包含 character_url 参数");
  console.log("5. ❌ @ 角色名直接写在提示词中即可");
}

main().catch(console.error);