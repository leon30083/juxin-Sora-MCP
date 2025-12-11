import { z } from "zod";
// 视频创建请求参数
export const CreateVideoRequestSchema = z.object({
    images: z.array(z.string().url()).describe("图片链接数组，可以为空数组"),
    model: z.literal("sora-2").describe("模型名称，固定为'sora-2'"),
    orientation: z.enum(["portrait", "landscape"]).describe("视频方向：portrait(竖屏) 或 landscape(横屏)"),
    prompt: z.string().min(1).max(1000).describe("视频生成提示词"),
    size: z.enum(["small", "large"]).describe("视频尺寸：small(720p) 或 large(1080p)"),
    duration: z.literal(10).describe("视频时长，目前支持10秒"),
    watermark: z.boolean().default(true).describe("是否添加水印"),
    private: z.boolean().default(true).describe("是否隐藏视频（不发布到公开画廊）")
});
// 视频创建响应
export const CreateVideoResponseSchema = z.object({
    id: z.string().describe("任务ID"),
    status: z.enum(["pending", "processing", "completed", "failed"]).describe("任务状态"),
    status_update_time: z.number().describe("状态更新时间戳")
});
// 视频查询请求参数
export const QueryVideoRequestSchema = z.object({
    id: z.string().describe("任务ID")
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
// 通用API错误响应
export const ApiErrorResponseSchema = z.object({
    error: z.object({
        message: z.string(),
        code: z.string().optional(),
        details: z.any().optional()
    })
});
//# sourceMappingURL=juxin.js.map