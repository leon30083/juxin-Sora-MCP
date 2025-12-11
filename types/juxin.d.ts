import { z } from "zod";
export declare const CreateVideoRequestSchema: z.ZodObject<{
    images: z.ZodArray<z.ZodString, "many">;
    model: z.ZodLiteral<"sora-2">;
    orientation: z.ZodEnum<["portrait", "landscape"]>;
    prompt: z.ZodString;
    size: z.ZodEnum<["small", "large"]>;
    duration: z.ZodLiteral<10>;
    watermark: z.ZodDefault<z.ZodBoolean>;
    private: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    images: string[];
    model: "sora-2";
    orientation: "portrait" | "landscape";
    prompt: string;
    size: "small" | "large";
    duration: 10;
    watermark: boolean;
    private: boolean;
}, {
    images: string[];
    model: "sora-2";
    orientation: "portrait" | "landscape";
    prompt: string;
    size: "small" | "large";
    duration: 10;
    watermark?: boolean | undefined;
    private?: boolean | undefined;
}>;
export type CreateVideoRequest = z.infer<typeof CreateVideoRequestSchema>;
export declare const CreateVideoResponseSchema: z.ZodObject<{
    id: z.ZodString;
    status: z.ZodEnum<["pending", "processing", "completed", "failed"]>;
    status_update_time: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    status: "pending" | "processing" | "completed" | "failed";
    id: string;
    status_update_time: number;
}, {
    status: "pending" | "processing" | "completed" | "failed";
    id: string;
    status_update_time: number;
}>;
export type CreateVideoResponse = z.infer<typeof CreateVideoResponseSchema>;
export declare const QueryVideoRequestSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export type QueryVideoRequest = z.infer<typeof QueryVideoRequestSchema>;
export declare const QueryVideoPendingResponseSchema: z.ZodObject<{
    id: z.ZodString;
    status: z.ZodLiteral<"pending">;
    detail: z.ZodObject<{
        id: z.ZodString;
        status: z.ZodLiteral<"pending">;
        pending_info: z.ZodObject<{
            progress_pct: z.ZodNumber;
            estimated_queue_wait_time: z.ZodNullable<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            progress_pct: number;
            estimated_queue_wait_time: number | null;
        }, {
            progress_pct: number;
            estimated_queue_wait_time: number | null;
        }>;
    }, "strip", z.ZodTypeAny, {
        status: "pending";
        id: string;
        pending_info: {
            progress_pct: number;
            estimated_queue_wait_time: number | null;
        };
    }, {
        status: "pending";
        id: string;
        pending_info: {
            progress_pct: number;
            estimated_queue_wait_time: number | null;
        };
    }>;
    status_update_time: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    status: "pending";
    id: string;
    status_update_time: number;
    detail: {
        status: "pending";
        id: string;
        pending_info: {
            progress_pct: number;
            estimated_queue_wait_time: number | null;
        };
    };
}, {
    status: "pending";
    id: string;
    status_update_time: number;
    detail: {
        status: "pending";
        id: string;
        pending_info: {
            progress_pct: number;
            estimated_queue_wait_time: number | null;
        };
    };
}>;
export declare const QueryVideoCompletedResponseSchema: z.ZodObject<{
    id: z.ZodString;
    status: z.ZodLiteral<"completed">;
    width: z.ZodNumber;
    height: z.ZodNumber;
    video_url: z.ZodString;
    thumbnail_url: z.ZodOptional<z.ZodString>;
    detail: z.ZodObject<{
        id: z.ZodString;
        status: z.ZodLiteral<"completed">;
        url: z.ZodString;
        gif_url: z.ZodOptional<z.ZodString>;
        thumbnail_url: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        status: "completed";
        id: string;
        url: string;
        thumbnail_url?: string | undefined;
        gif_url?: string | undefined;
    }, {
        status: "completed";
        id: string;
        url: string;
        thumbnail_url?: string | undefined;
        gif_url?: string | undefined;
    }>;
    status_update_time: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    status: "completed";
    id: string;
    status_update_time: number;
    detail: {
        status: "completed";
        id: string;
        url: string;
        thumbnail_url?: string | undefined;
        gif_url?: string | undefined;
    };
    width: number;
    height: number;
    video_url: string;
    thumbnail_url?: string | undefined;
}, {
    status: "completed";
    id: string;
    status_update_time: number;
    detail: {
        status: "completed";
        id: string;
        url: string;
        thumbnail_url?: string | undefined;
        gif_url?: string | undefined;
    };
    width: number;
    height: number;
    video_url: string;
    thumbnail_url?: string | undefined;
}>;
export declare const QueryVideoFailedResponseSchema: z.ZodObject<{
    id: z.ZodString;
    status: z.ZodLiteral<"failed">;
    error: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "failed";
    id: string;
    error?: string | undefined;
}, {
    status: "failed";
    id: string;
    error?: string | undefined;
}>;
export type QueryVideoResponse = z.infer<typeof QueryVideoPendingResponseSchema> | z.infer<typeof QueryVideoCompletedResponseSchema> | z.infer<typeof QueryVideoFailedResponseSchema>;
export declare const ApiErrorResponseSchema: z.ZodObject<{
    error: z.ZodObject<{
        message: z.ZodString;
        code: z.ZodOptional<z.ZodString>;
        details: z.ZodOptional<z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        message: string;
        code?: string | undefined;
        details?: any;
    }, {
        message: string;
        code?: string | undefined;
        details?: any;
    }>;
}, "strip", z.ZodTypeAny, {
    error: {
        message: string;
        code?: string | undefined;
        details?: any;
    };
}, {
    error: {
        message: string;
        code?: string | undefined;
        details?: any;
    };
}>;
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;
//# sourceMappingURL=juxin.d.ts.map