import {
  CreateVideoRequest,
  CreateVideoResponse,
  QueryVideoRequest,
  QueryVideoResponse,
  CreateCharacterRequest,
  CreateCharacterResponse,
  ApiErrorResponse
} from "../types/juxin.js";

export class JuxinApiClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(apiKey: string, baseUrl: string = "https://api.jxincm.cn") {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  /**
   * 创建视频生成任务
   */
  async createVideo(request: CreateVideoRequest): Promise<CreateVideoResponse> {
    const response = await fetch(`${this.baseUrl}/v1/video/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const errorData: ApiErrorResponse | null = await response.json().catch(() => null);
      const errorMessage = errorData?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(`创建视频失败: ${errorMessage}`);
    }

    const data = await response.json();
    return data as CreateVideoResponse;
  }

  /**
   * 查询视频生成状态
   */
  async queryVideoStatus(request: QueryVideoRequest): Promise<QueryVideoResponse> {
    const url = new URL(`${this.baseUrl}/v1/video/query`);
    url.searchParams.append("id", request.id);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${this.apiKey}`
      }
    });

    if (!response.ok) {
      const errorData: ApiErrorResponse | null = await response.json().catch(() => null);
      const errorMessage = errorData?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(`查询视频状态失败: ${errorMessage}`);
    }

    const data = await response.json();
    return data as QueryVideoResponse;
  }

  /**
   * 等待视频生成完成
   * @param taskId 任务ID
   * @param options 配置选项
   * @returns 最终的视频URL
   */
  async waitForVideoCompletion(
    taskId: string,
    options: {
      maxRetries?: number;
      pollingInterval?: number;
      timeout?: number;
    } = {}
  ): Promise<{ videoUrl: string; thumbnailUrl?: string }> {
    const {
      maxRetries = 60, // 最多轮询60次（约10分钟）
      pollingInterval = 10000, // 每10秒查询一次
      timeout = 600000 // 10分钟超时
    } = options;

    const startTime = Date.now();

    for (let i = 0; i < maxRetries; i++) {
      // 检查是否超时
      if (Date.now() - startTime > timeout) {
        throw new Error(`视频生成超时，已等待${timeout/1000}秒`);
      }

      try {
        const result = await this.queryVideoStatus({ id: taskId });

        switch (result.status) {
          case "completed":
            return {
              videoUrl: result.video_url,
              thumbnailUrl: result.thumbnail_url
            };

          case "failed":
            throw new Error(`视频生成失败: ${result.error || "未知错误"}`);

          case "pending":
            // 计算进度
            const progress = (result as any).detail?.pending_info?.progress_pct || 0;
            console.log(`视频生成进度: ${Math.round(progress * 100)}%`);

            // 如果不是最后一次尝试，等待后继续
            if (i < maxRetries - 1) {
              await new Promise(resolve => setTimeout(resolve, pollingInterval));
            }
            break;

        case "processing":
            console.log("正在处理中...");

            // 如果不是最后一次尝试，等待后继续
            if (i < maxRetries - 1) {
              await new Promise(resolve => setTimeout(resolve, pollingInterval));
            }
            break;
        }
      } catch (error) {
        // 如果是最后一次尝试，直接抛出错误
        if (i === maxRetries - 1) {
          throw error;
        }

        // 否则记录错误并继续
        console.error(`查询状态失败 (${i + 1}/${maxRetries}):`, error);
        await new Promise(resolve => setTimeout(resolve, pollingInterval));
      }
    }

    throw new Error(`视频生成未在预期时间内完成，已尝试${maxRetries}次`);
  }

  /**
   * 创建角色
   */
  async createCharacter(request: CreateCharacterRequest): Promise<CreateCharacterResponse> {
    const response = await fetch(`${this.baseUrl}/sora/v1/characters`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const errorData: ApiErrorResponse | null = await response.json().catch(() => null);
      const errorMessage = errorData?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(`创建角色失败: ${errorMessage}`);
    }

    const data = await response.json();
    return data as CreateCharacterResponse;
  }

  /**
   * 使用聊天格式创建角色视频（直接返回视频链接）
   */
  async createCharacterVideoChat(prompt: string): Promise<{ videoUrl: string }> {
    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: "sora-2",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        stream: false
      })
    });

    if (!response.ok) {
      const errorData: ApiErrorResponse | null = await response.json().catch(() => null);
      const errorMessage = errorData?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(`创建角色视频失败: ${errorMessage}`);
    }

    const data = await response.json();

    // 解析响应中的视频链接
    if (data.choices && data.choices[0] && data.choices[0].message) {
      const content = data.choices[0].message.content;
      // 查找下载链接
      const match = content.match(/\[download video\]\((https:\/\/[^)]+)\)/);
      if (match && match[1]) {
        return { videoUrl: match[1] };
      }
    }

    throw new Error("无法从响应中提取视频链接");
  }
}