#!/usr/bin/env node
import { JuxinApiClient } from "./dist/juxin-client.js";

const client = new JuxinApiClient("sk-Q6DwAtsNvutSlaZXYAzXR39pUmwKHAHDgll0QifCL5GbwJd7");
const taskIds = ["video_ba3a8df4-896b-490c-a5f2-8f2b9d87c771","video_7313a80d-0cda-4658-8689-a050aeb0cc33","video_621d3f0e-d61f-47eb-9473-47bc0f1caf98","video_31364d26-8ecb-4fcb-8174-7386df9593fb"];

async function queryAll() {
  console.log("\n🔍 批量查询序列任务状态");
  console.log("=" * 60);

  for (let i = 0; i < taskIds.length; i++) {
    const taskId = taskIds[i];
    console.log(`\n${i + 1}. 任务 ${taskId}:`);

    try {
      const response = await client.queryVideoStatus({ id: taskId });
      console.log(`   状态: ${response.status}`);

      if (response.status === "completed") {
        console.log(`   视频: ${response.video_url}`);
      }
    } catch (error) {
      console.log(`   查询失败: ${error.message}`);
    }
  }
}

queryAll();
