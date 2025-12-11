#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { JuxinApiClient } from "./juxin-client.js";
import { TaskManager } from "./task-manager.js";
import {
  CreateVideoRequestSchema,
  QueryVideoRequestSchema,
  CreateCharacterRequestSchema,
  CreateVideoRequest,
  QueryVideoRequest,
  CreateCharacterRequest
} from "../types/juxin.js";

// 从环境变量获取配置
const apiKey = process.env.JUXIN_API_KEY;
if (!apiKey) {
  throw new Error("请设置 JUXIN_API_KEY 环境变量");
}

// 创建聚鑫API客户端
const client = new JuxinApiClient(
  apiKey,
  process.env.JUXIN_API_BASE_URL || "https://api.jxincm.cn"
);

// 创建任务管理器
const taskManager = new TaskManager("tasks.json");
// 初始化任务管理器（异步）
taskManager.init().catch(console.error);

// 创建MCP服务器
const server = new Server(
  {
    name: process.env.MCP_SERVER_NAME || "juxin-mcp-server",
    version: process.env.MCP_SERVER_VERSION || "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 定义工具列表
const tools: Tool[] = [
  {
    name: "create_video",
    description: "使用聚鑫Sora-2 API创建视频生成任务",
    inputSchema: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description: "视频生成的提示词，描述你想要创建的视频内容",
          minLength: 1,
          maxLength: 1000
        },
        orientation: {
          type: "string",
          enum: ["portrait", "landscape"],
          description: "视频方向：portrait(竖屏) 或 landscape(横屏，16:9)",
          default: "landscape"
        },
        size: {
          type: "string",
          enum: ["small", "large"],
          description: "视频尺寸：small(720p) 或 large(1080p)",
          default: "small"
        },
        images: {
          type: "array",
          items: {
            type: "string",
            format: "uri"
          },
          description: "参考图片的URL数组（可选），如果不提供图片则为文生视频",
          default: []
        },
        duration: {
          type: "integer",
          enum: [10, 15],
          description: "视频时长（秒），支持10秒和15秒，默认15秒",
          default: 15
        },
        watermark: {
          type: "boolean",
          description: "是否添加水印，false为无水印，true会优先无水印",
          default: false
        },
        private: {
          type: "boolean",
          description: "是否隐藏视频（不发布到公开画廊）",
          default: true
        },
        wait_for_completion: {
          type: "boolean",
          description: "是否等待视频生成完成再返回，如果为false则立即返回任务ID",
          default: false
        },
        character_url: {
          type: "string",
          description: "角色视频URL（用于角色视频创建）",
          format: "uri"
        },
        character_timestamps: {
          type: "string",
          description: "角色时间戳，单位秒，例如 '1,2' 是指视频的1～2秒中出现的角色"
        }
      },
      required: ["prompt"]
    }
  },
  {
    name: "create_character_video_chat",
    description: "使用聊天格式创建角色视频，直接返回视频链接（更快的响应）",
    inputSchema: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description: "视频生成的提示词，可以包含@角色名，例如：'@fpjhyfzxl.grandvizie 在宫殿中漫步'",
          minLength: 1,
          maxLength: 1000
        }
      },
      required: ["prompt"]
    }
  },
  {
    name: "create_character",
    description: "从视频中创建角色，用于后续的角色视频生成",
    inputSchema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "视频中包含需要创建角色的视频URL",
          format: "uri"
        },
        timestamps: {
          type: "string",
          description: "单位秒，例如 '1,2' 是指视频的1～2秒中出现的角色，注意范围差值最大 3 秒最小 1 秒"
        }
      },
      required: ["url", "timestamps"]
    }
  },
  {
    name: "query_video_status",
    description: "查询视频生成任务的状态",
    inputSchema: {
      type: "object",
      properties: {
        task_id: {
          type: "string",
          description: "视频生成任务的ID"
        }
      },
      required: ["task_id"]
    }
  },
  {
    name: "query_all_videos",
    description: "查询所有视频任务的状态。可以同时查询多个任务ID，最多支持20个任务。",
    inputSchema: {
      type: "object",
      properties: {
        task_ids: {
          type: "array",
          items: {
            type: "string"
          },
          description: "要查询的视频任务ID列表，每个ID都应该是完整的任务ID"
        }
      },
      required: ["task_ids"]
    }
  },
  {
    name: "list_tasks",
    description: "列出所有视频任务，包括统计信息和最近的任务列表",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "integer",
          description: "返回最近任务的数量（可选），默认为10",
          default: 10,
          minimum: 1,
          maximum: 50
        },
        status: {
          type: "string",
          enum: ["all", "pending", "processing", "completed", "failed"],
          description: "过滤任务状态（可选）",
          default: "all"
        }
      }
    }
  }
];

// 注册工具列表处理器
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools,
  };
});

// 注册工具调用处理器
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

// 确保args存在
    if (!args) {
      throw new Error("缺少工具参数");
    }

  try {
    switch (name) {
      case "create_video": {
        // 验证输入参数
        const { model, ...createVideoArgs } = CreateVideoRequestSchema.parse(args);

        const videoRequest: CreateVideoRequest = {
          ...createVideoArgs,
          model: "sora-2"
        };

        // 创建视频生成任务
        const response = await client.createVideo(videoRequest);

        // 自动记录任务
        try {
          await taskManager.createTask(response.id, videoRequest.prompt, videoRequest);
        } catch (error) {
          console.error("[MCP Server] 记录任务失败:", error);
        }

        const content = [
          {
            type: "text",
            text: `✅ 视频创建成功！\n\n任务ID: ${response.id}\n初始状态: ${response.status}\n\n` +
                  `你可以使用 query_video_status 工具查询生成进度。`
          }
        ];

        // 如果需要等待完成
        if (args.wait_for_completion) {
          content.push({
            type: "text",
            text: "\n正在等待视频生成完成，这可能需要几分钟..."
          });

          try {
            const result = await client.waitForVideoCompletion(response.id, {
              pollingInterval: 15000, // 15秒查询一次
              timeout: 600000 // 10分钟超时
            });

            content.push({
              type: "text",
              text: `\n✨ 视频生成完成！\n\n视频链接: ${result.videoUrl}` +
                    (result.thumbnailUrl ? `\n缩略图: ${result.thumbnailUrl}` : "")
            });

            return {
              content,
            };
          } catch (error) {
            content.push({
              type: "text",
              text: `\n❌ 等待视频生成完成时出错: ${error instanceof Error ? error.message : "未知错误"}`
            });

            return {
              content,
            };
          }
        }

        return {
          content,
        };
      }

      case "create_character_video_chat": {
        // 验证输入参数
        const prompt = args.prompt;
        if (!prompt || typeof prompt !== "string") {
          throw new Error("prompt 参数是必需的且必须是字符串");
        }

        // 创建角色视频
        const response = await client.createCharacterVideoChat(prompt);

        return {
          content: [
            {
              type: "text",
              text: `✅ 角色视频创建成功！\n\n` +
                    `视频链接: ${response.videoUrl}\n\n` +
                    `💡 提示: 您可以直接下载或使用此链接`
            }
          ]
        };
      }

      case "create_character": {
        // 验证输入参数
        const createCharacterArgs = CreateCharacterRequestSchema.parse(args);

        // 创建角色
        const response = await client.createCharacter(createCharacterArgs);

        return {
          content: [
            {
              type: "text",
              text: `✅ 角色创建成功！\n\n` +
                    `角色ID: ${response.id}\n` +
                    `角色名称: ${response.username}\n` +
                    `角色主页: ${response.permalink}\n` +
                    `角色头像: ${response.profile_picture_url}\n\n` +
                    `💡 提示: 现在您可以使用这个角色名称 @${response.username} 在提示词中创建角色视频了！`
            }
          ]
        };
      }

      case "query_video_status": {
        // 验证输入参数
        const task_id = args.task_id;
        if (!task_id || typeof task_id !== "string") {
          throw new Error("task_id 参数是必需的且必须是字符串");
        }

        // 查询视频状态
        const response = await client.queryVideoStatus({ id: task_id });

        let statusText = "";
        let videoUrl = "";
        let thumbnailUrl = "";

        switch (response.status) {
          case "pending":
            const progress = response.detail.pending_info?.progress_pct || 0;
            const waitTime = response.detail.pending_info?.estimated_queue_wait_time;
            statusText = `⏳ 等待中\n进度: ${Math.round(progress * 100)}%` +
                        (waitTime ? `\n预计等待时间: ${Math.round(waitTime / 1000)}秒` : "");
            break;

          case "processing":
            statusText = "🔄 正在生成视频中...";
            break;

          case "completed":
            statusText = "✅ 生成完成";
            videoUrl = response.video_url;
            thumbnailUrl = response.thumbnail_url || "";
            break;

          case "failed":
            statusText = `❌ 生成失败${response.error ? ": " + response.error : ""}`;
            break;
        }

        // 获取更新时间，处理不同响应格式
        const updateTime = (response as any).status_update_time || Date.now();
        let responseText = `任务状态: ${statusText}\n最后更新: ${new Date(updateTime).toLocaleString()}`;

        if (videoUrl) {
          responseText += `\n\n视频链接: ${videoUrl}`;
        }
        if (thumbnailUrl) {
          responseText += `\n缩略图: ${thumbnailUrl}`;
        }

        return {
          content: [
            {
              type: "text",
              text: responseText
            }
          ]
        };
      }

      case "query_all_videos": {
        // 批量查询任务
        const { task_ids } = args;

        if (!Array.isArray(task_ids) || task_ids.length === 0) {
          throw new Error("task_ids 必须是包含任务ID的非空数组");
        }

        if (task_ids.length > 20) {
          throw new Error("一次最多只能查询20个任务");
        }

        const results = await Promise.allSettled(
          task_ids.map(async (task_id) => {
            try {
              const response = await client.queryVideoStatus({ id: task_id });
              return { id: task_id, status: response.status, data: response };
            } catch (error) {
              return { id: task_id, status: "error", error: String(error) };
            }
          })
        );

        const completed = results.filter(r => r.status === "fulfilled" && (r as any).value.status === "completed").length;
        const processing = results.filter(r => r.status === "fulfilled" && ((r as any).value.status === "processing" || (r as any).value.status === "in_progress")).length;
        const pending = results.filter(r => r.status === "fulfilled" && ((r as any).value.status === "pending" || (r as any).value.status === "queued")).length;
        const failed = results.filter(r => r.status === "fulfilled" && (r as any).value.status === "failed").length;
        const errors = results.filter(r => r.status === "rejected" || (r as any).value?.status === "error").length;

        let resultText = `📊 批量查询结果 (${task_ids.length} 个任务)\n\n`;
        resultText += `✅ 完成: ${completed}\n`;
        resultText += `🔄 处理中: ${processing}\n`;
        resultText += `⏳ 等待中: ${pending}\n`;
        resultText += `❌ 失败: ${failed}\n`;
        if (errors > 0) resultText += `⚠️  查询错误: ${errors}\n\n`;

        results.forEach((result, index) => {
          const taskId = task_ids[index];
          if (result.status === "fulfilled") {
            const r = result.value as any;
            resultText += `\n${index + 1}. ${taskId}\n`;
            resultText += `   状态: ${r.status}\n`;
            if (r.status === "completed" && r.data.video_url) {
              resultText += `   视频: ${r.data.video_url}\n`;
            } else if (r.status === "failed" && r.data.error) {
              resultText += `   错误: ${r.data.error}\n`;
            }
          } else {
            resultText += `\n${index + 1}. ${taskId}\n   查询失败: ${result.reason}\n`;
          }
        });

        return {
          content: [
            {
              type: "text",
              text: resultText
            }
          ]
        };
      }

      case "list_tasks": {
        // 获取任务列表
        const limit = typeof args.limit === "number" ? args.limit : 10;
        const statusFilter = args.status || "all";

        const allTasks = await taskManager.getAllTasks();
        const stats = await taskManager.getStats();

        let filteredTasks = allTasks;
        if (statusFilter !== "all") {
          filteredTasks = allTasks.filter(t => t.status === statusFilter);
        }

        const tasksToShow = filteredTasks.slice(0, limit);

        let resultText = `📋 任务统计\n`;
        resultText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        resultText += `总任务数: ${stats.total}\n`;
        resultText += `正在处理: ${stats.processing}\n`;
        resultText += `等待中: ${stats.pending}\n`;
        resultText += `已完成: ${stats.completed}\n`;
        resultText += `失败: ${stats.failed}\n`;
        resultText += `成功率: ${stats.success_rate}\n\n`;

        if (tasksToShow.length > 0) {
          resultText += `📊 最近任务 (${statusFilter === "all" ? "全部" : statusFilter})\n`;
          resultText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

          tasksToShow.forEach((task, index) => {
            resultText += `\n${index + 1}. ${task.id}\n`;
            resultText += `   状态: ${task.status}\n`;
            resultText += `   提示词: ${task.prompt.substring(0, 50)}${task.prompt.length > 50 ? "..." : ""}\n`;
            resultText += `   创建时间: ${new Date(task.created_at).toLocaleString()}\n`;

            if (task.completed_at) {
              resultText += `   完成时间: ${new Date(task.completed_at).toLocaleString()}\n`;
              const duration = Math.round((task.completed_at - task.created_at) / 1000 / 60);
              resultText += `   用时: ${duration}分钟\n`;
            }

            if (task.video_url) {
              resultText += `   视频链接: ${task.video_url}\n`;
            }

            if (task.params) {
              let paramsText = `   参数: ${task.params.orientation}, ${task.params.size}, ${task.params.duration}秒, 水印: ${task.params.watermark}`;
              if (task.params.character_url) {
                paramsText += `, 角色: ${task.params.character_timestamps || "N/A"}`;
              }
              paramsText += `\n`;
              resultText += paramsText;
            }
          });
        } else {
          resultText += `\n没有找到符合条件的任务\n`;
        }

        return {
          content: [
            {
              type: "text",
              text: resultText
            }
          ]
        };
      }

      default:
        throw new Error(`未知的工具: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "未知错误";

    // 提供更友好的错误信息
    let userFriendlyMessage = errorMessage;
    if (errorMessage.includes("401")) {
      userFriendlyMessage = "API密钥无效，请检查 JUXIN_API_KEY 环境变量是否正确设置";
    } else if (errorMessage.includes("429")) {
      userFriendlyMessage = "请求过于频繁，请稍后再试";
    } else if (errorMessage.includes("500")) {
      userFriendlyMessage = "服务器内部错误，请稍后再试";
    }

    return {
      content: [
        {
          type: "text",
          text: `❌ 错误: ${userFriendlyMessage}`
        }
      ],
      isError: true
    };
  }
});

// 启动服务器
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Juxin MCP server running on stdio");
}

// 错误处理
main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});