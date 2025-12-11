#!/usr/bin/env node

/**
 * 根据视频生成指令创建视频
 */

import { JuxinApiClient } from "./dist/juxin-client.js";

const apiKey = "sk-Q6DwAtsNvutSlaZXYAzXR39pUmwKHAHDgll0QifCL5GbwJd7";
const client = new JuxinApiClient(apiKey);

async function createVideoFromInstructions() {
  console.log("\n🎬 使用视频生成指令创建视频");
  console.log("=" .repeat(60));

  // 从文件读取的指令
  const instruction = {
    sequence_id: "Xuanwu-Part2-Entry",
    total_duration: 14.0,
    style: "2D vector art, stick figure characters with round heads, clear black ink outlines, Chinese ink wash aesthetic, parchment paper background, minimalist and expressive animation, historical documentary style",
    shots: [
      {
        shot_id: "01",
        duration: 2.0,
        camera: "Close Up",
        action: "Horse hooves stepping rhythmically on the stone bricks, dust rising slightly"
      },
      {
        shot_id: "02",
        duration: 4.0,
        camera: "Side Profile",
        action: "@fpjhyfzxl.grandvizie riding slowly, clear ink lines, wearing light robes instead of armor, expression relaxed"
      },
      {
        shot_id: "03",
        duration: 4.0,
        camera: "Side Profile",
        action: "@jasvwqpvt.hanblueher riding alongside, clear ink lines, carrying a simple bow, looking forward casually"
      },
      {
        shot_id: "04",
        duration: 4.0,
        camera: "Medium Shot",
        action: "@fpjhyfzxl.grandvizie and @jasvwqpvt.hanblueher riding side by side, robes fluttering gently in the morning breeze"
      }
    ]
  };

  // 生成描述性提示词
  const prompt = `Chinese ink wash style animation: Two stick figure characters with round heads riding horses through ancient Chinese landscape. First scene shows horse hooves on stone bricks with dust. Then two characters in light robes riding side by side - one is fpjhyfzxl.grandvizie, the other is jasvwqpvt.hanblueher carrying a bow. Their robes flutter in the morning breeze. Clear black ink outlines, minimalist style, parchment paper background, historical documentary aesthetic. ${instruction.style}`;

  console.log("\n📝 视频参数:");
  console.log(`   序列ID: ${instruction.sequence_id}`);
  console.log(`   总时长: ${instruction.total_duration}秒`);
  console.log(`   风格: 中国水墨画动画风格`);
  console.log(`   场景数: ${instruction.shots.length}个`);

  const createRequest = {
    images: [],
    model: "sora-2",
    orientation: "landscape",
    prompt: prompt,
    size: "large",
    duration: 15, // 使用15秒，接近总时长
    watermark: false,
    private: true
  };

  try {
    console.log("\n🎥 正在创建视频...");
    console.log("   场景描述: 两个简笔画风格的人物骑马穿过古风中国景观");
    console.log("   艺术风格: 中国水墨画，简约动画，历史纪录片风格");

    const response = await client.createVideo(createRequest);

    console.log("\n✅ 视频任务创建成功！");
    console.log(`   任务ID: ${response.id}`);
    console.log(`   状态: ${response.status}`);

    console.log("\n📊 开始监控生成进度...");

    // 监控任务
    const taskId = response.id;
    const maxWaitTime = 600000; // 10分钟超时
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const status = await client.queryVideoStatus({ id: taskId });

        if (status.status === "completed") {
          console.log("\n🎉 视频生成完成！");
          console.log(`\n📹 视频链接: ${status.video_url}`);

          // 下载视频
          console.log("\n📥 正在下载视频...");
          const { spawn } = await import("child_process");
          const curl = spawn("curl", [
            "-o", "玄武篇第二部_水墨画动画.mp4",
            status.video_url
          ]);

          curl.on("close", (code) => {
            if (code === 0) {
              console.log("\n✅ 视频下载成功！");
              console.log("文件名: 玄武篇第二部_水墨画动画.mp4");

              console.log("\n🎨 视频特点:");
              console.log("- 中国水墨画风格");
              console.log("- 简笔人物动画");
              console.log("- 历史纪录片质感");
              console.log("- 横屏16:9比例");
              console.log("- 15秒时长");
            }
          });

          return;
        } else if (status.status === "failed") {
          console.log(`\n❌ 生成失败: ${status.error}`);
          return;
        }

        // 显示进度
        if (status.status === "processing") {
          process.stdout.write(".");
        }

        await new Promise(resolve => setTimeout(resolve, 10000));

      } catch (error) {
        console.error(`\n查询错误: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }

    console.log("\n⚠️ 等待超时");

  } catch (error) {
    console.error("\n❌ 创建失败:", error.message);
  }
}

createVideoFromInstructions();