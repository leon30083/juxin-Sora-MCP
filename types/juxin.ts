import { z } from "zod";

// 视频创建请求参数
export const CreateVideoRequestSchema = z.object({
  images: z.array(z.string().url()).describe("图片链接数组，可以为空数组"),
  model: z.literal("sora-2").describe("模型名称，固定为'sora-2'"),
  orientation: z.enum(["portrait", "landscape"]).default("landscape").describe("视频方向：portrait(竖屏) 或 landscape(横屏，16:9)"),
  prompt: z.string().min(1).max(1000).describe("视频生成提示词"),
  size: z.enum(["small", "large"]).default("small").describe("视频尺寸：small(720p) 或 large(1080p)"),
  duration: z.union([z.literal(10), z.literal(15)]).default(15).describe("视频时长（秒），支持10秒和15秒，默认15秒"),
  watermark: z.boolean().default(false).describe("是否添加水印，false为无水印，true会优先无水印"),
  private: z.boolean().default(true).describe("是否隐藏视频（不发布到公开画廊）"),
  // 角色视频相关参数
  character_url: z.string().url().optional().describe("角色视频URL（用于角色视频创建）"),
  character_timestamps: z.string().optional().describe("角色时间戳，单位秒，例如 '1,2' 是指视频的1～2秒中出现的角色")
}).superRefine((data, ctx) => {
  // 如果提供了character_url，则必须提供character_timestamps
  if (data.character_url && !data.character_timestamps) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "character_timestamps is required when character_url is provided"
    });
  }
  // 如果提供了character_timestamps，则必须提供character_url
  if (data.character_timestamps && !data.character_url) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "character_url is required when character_timestamps is provided"
    });
  }
});

export type CreateVideoRequest = z.infer<typeof CreateVideoRequestSchema>;

// 角色创建请求参数
export const CreateCharacterRequestSchema = z.object({
  url: z.string().url().describe("视频中包含需要创建角色的视频URL"),
  timestamps: z.string().describe("单位秒，例如 '1,2' 是指视频的1～2秒中出现的角色，注意范围差值最大 3 秒最小 1 秒")
});

export type CreateCharacterRequest = z.infer<typeof CreateCharacterRequestSchema>;

// 角色创建响应
export const CreateCharacterResponseSchema = z.object({
  id: z.string().describe("角色id"),
  username: z.string().describe("角色名称，用于放在提示词中 @{username}"),
  permalink: z.string().url().describe("角色主页，跳转到 openai 角色主页"),
  profile_picture_url: z.string().url().describe("角色头像")
});

export type CreateCharacterResponse = z.infer<typeof CreateCharacterResponseSchema>;

// 视频创建响应
export const CreateVideoResponseSchema = z.object({
  id: z.string().describe("任务ID"),
  status: z.enum(["pending", "processing", "completed", "failed"]).describe("任务状态"),
  status_update_time: z.number().describe("状态更新时间戳")
});

export type CreateVideoResponse = z.infer<typeof CreateVideoResponseSchema>;

// 视频查询请求参数
export const QueryVideoRequestSchema = z.object({
  id: z.string().describe("任务ID")
});

export type QueryVideoRequest = z.infer<typeof QueryVideoRequestSchema>;

// 视频查询响应 - 处理中状态
export const QueryVideoProcessingResponseSchema = z.object({
  id: z.string(),
  status: z.literal("processing"),
  status_update_time: z.number()
});

// 视频查询响应 - 待处理状态
export const QueryVideoPendingResponseSchema = z.object({
  id: z.string(),
  status: z.literal("pending"),
  detail: z.object({
    id: z.string(),
    status: z.literal("pending"),
    pending_info: z.object({
      progress_pct: z.number(),
      estimated_queue_wait_time: z.number().nullable()
    })
  }),
  status_update_time: z.number()
});

// 视频查询响应 - 完成状态
export const QueryVideoCompletedResponseSchema = z.object({
  id: z.string(),
  status: z.literal("completed"),
  width: z.number(),
  height: z.number(),
  video_url: z.string().url(),
  thumbnail_url: z.string().url().optional(),
  detail: z.object({
    id: z.string(),
    status: z.literal("completed"),
    url: z.string().url(),
    gif_url: z.string().url().optional(),
    thumbnail_url: z.string().url().optional()
  }),
  status_update_time: z.number()
});

// 视频查询响应 - 失败状态
export const QueryVideoFailedResponseSchema = z.object({
  id: z.string(),
  status: z.literal("failed"),
  error: z.string().optional().describe("错误信息")
});

export type QueryVideoResponse =
  | z.infer<typeof QueryVideoPendingResponseSchema>
  | z.infer<typeof QueryVideoProcessingResponseSchema>
  | z.infer<typeof QueryVideoCompletedResponseSchema>
  | z.infer<typeof QueryVideoFailedResponseSchema>;

// 通用API错误响应
export const ApiErrorResponseSchema = z.object({
  error: z.object({
    message: z.string(),
    code: z.string().optional(),
    details: z.any().optional()
  })
});

export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;