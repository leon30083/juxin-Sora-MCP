#!/usr/bin/env node

import { TaskManager } from "./dist/task-manager.js";

const taskManager = new TaskManager();

async function main() {
  await taskManager.init();

  console.log("\n📋 所有任务列表");
  console.log("=" * 80);

  const allTasks = await taskManager.getAllTasks();
  const stats = await taskManager.getStats();

  console.log(`总任务数: ${stats.total}`);
  console.log(`等待中: ${stats.pending}`);
  console.log(`处理中: ${stats.processing}`);
  console.log(`已完成: ${stats.completed}`);
  console.log(`失败: ${stats.failed}`);
  console.log(`成功率: ${stats.success_rate}`);

  if (allTasks.length > 0) {
    console.log("\n最近的任务:");
    allTasks.slice(0, 10).forEach((task, index) => {
      console.log(`\n${index + 1}. ${task.id}`);
      console.log(`   状态: ${task.status}`);
      console.log(`   提示词: ${task.prompt.substring(0, 50)}...`);
      if (task.params?.character_url) {
        console.log(`   角色: 是 (时间戳: ${task.params.character_timestamps})`);
      }
    });
  }
}

main().catch(console.error);