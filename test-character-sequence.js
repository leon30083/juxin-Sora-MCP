#!/usr/bin/env node

/**
 * 测试角色序列视频创建
 * 使用用户提供的具体指令格式
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
  console.log("\n🎬 测试角色序列视频创建");
  console.log("=" * 80);
  console.log(`序列ID: ${videoSequence.sequence_id}`);
  console.log(`总时长: ${videoSequence.total_duration}秒`);
  console.log(`风格: ${videoSequence.style}`);
  console.log(`镜头数: ${videoSequence.shots.length}`);
  console.log("\n📋 镜头列表:");

  const taskIds = [];

  // 为每个镜头创建视频任务
  for (const shot of videoSequence.shots) {
    console.log(`\n🎥 创建镜头 ${shot.shot_id}:`);
    console.log(`   时长: ${shot.duration}秒`);
    console.log(`   景别: ${shot.camera}`);
    console.log(`   动作: ${shot.action}`);

    // 构建完整的提示词
    const prompt = `${videoSequence.style}, ${shot.camera} shot, ${shot.action}`;

    try {
      const response = await client.createVideo({
        prompt: prompt,
        orientation: "landscape",
        size: "small",
        duration: 15, // 使用15秒以确保覆盖所需时长
        watermark: false,
        private: true,
        images: []
      });

      taskIds.push({
        shot_id: shot.shot_id,
        task_id: response.id
      });

      console.log(`   ✅ 创建成功，任务ID: ${response.id}`);
    } catch (error) {
      console.error(`   ❌ 创建失败: ${error.message}`);
      // 即使失败也记录，以便后续查询
      taskIds.push({
        shot_id: shot.shot_id,
        task_id: null,
        error: error.message
      });
    }
  }

  // 保存任务ID到文件
  try {
    await fs.writeFile("sequence-tasks.json", JSON.stringify({
      sequence_id: videoSequence.sequence_id,
      created_at: new Date().toISOString(),
      tasks: taskIds
    }, null, 2));

    console.log("\n📁 任务信息已保存到 sequence-tasks.json");
  } catch (error) {
    console.error("\n⚠️  保存任务信息失败:", error.message);
  }

  // 显示汇总
  console.log("\n📊 创建汇总:");
  console.log(`   总镜头数: ${videoSequence.shots.length}`);
  console.log(`   成功创建: ${taskIds.filter(t => t.task_id).length}`);
  console.log(`   创建失败: ${taskIds.filter(t => !t.task_id).length}`);

  // 如果有成功的任务，提供查询指令
  const successfulTasks = taskIds.filter(t => t.task_id);
  if (successfulTasks.length > 0) {
    console.log("\n💡 查询指令:");
    console.log("   查询单个任务:");
    successfulTasks.forEach(task => {
      console.log(`   node query-single-task.js ${task.task_id} # 镜头${task.shot_id}`);
    });

    console.log("\n   批量查询所有任务:");
    console.log(`   node query-batch.js ${successfulTasks.map(t => t.task_id).join(' ')}`);

    // 创建批量查询脚本
    const batchQueryScript = `#!/usr/bin/env node
import { JuxinApiClient } from "./dist/juxin-client.js";

const apiKey = "sk-Q6DwAtsNvutSlaZXYAzXR39pUmwKHAHDgll0QifCL5GbwJd7";
const client = new JuxinApiClient(apiKey);

const taskIds = ${JSON.stringify(successfulTasks.map(t => t.task_id))};

async function queryAll() {
  console.log("\\n🔍 查询序列任务状态");
  console.log("=" * 60);

  const results = await Promise.allSettled(
    taskIds.map(async (taskId) => {
      try {
        const response = await client.queryVideoStatus({ id: taskId });
        return { id: taskId, status: response.status, data: response };
      } catch (error) {
        return { id: taskId, status: "error", error: String(error) };
      }
    })
  );

  results.forEach((result, index) => {
    const taskId = taskIds[index];
    const shotInfo = taskIds.find(t => t.task_id === taskId);
    console.log(\`\\n\${index + 1}. 任务 \${taskId} (镜头\${shotInfo?.shot_id || '?'}):\`);

    if (result.status === "fulfilled") {
      const r = result.value;
      console.log(\`   状态: \${r.status}\`);
      if (r.status === "completed" && r.data.video_url) {
        console.log(\`   视频: \${r.data.video_url}\`);
      }
    } else {
      console.log(\`   查询失败: \${result.reason}\`);
    }
  });
}

queryAll();
`;

    try {
      await fs.writeFile("query-sequence.js", batchQueryScript);
      console.log("\n   已创建查询脚本: node query-sequence.js");
    } catch (error) {
      console.error("   创建查询脚本失败:", error.message);
    }
  }
}

// 运行测试
async function main() {
  console.log("🏛️  玄武篇第二部 - 角色序列视频测试");
  console.log("=" * 80);
  console.log("使用角色: 李建成 (@fpjhyfzxl.grandvizie) 和 李元吉 (@jasvwqpvt.hanblueher)");

  await testCharacterSequence();

  console.log("\n✨ 测试完成！");
  console.log("\n📌 后续操作:");
  console.log("1. 等待视频生成完成");
  console.log("2. 使用 node query-sequence.js 查询所有任务状态");
  console.log("3. 下载完成的视频到工作区");
}

main().catch(console.error);