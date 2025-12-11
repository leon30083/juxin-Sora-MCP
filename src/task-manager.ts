import fs from "fs/promises";
import path from "path";
import { CreateVideoRequest } from "../types/juxin.js";

export interface Task {
  id: string;
  prompt: string;
  status: "pending" | "processing" | "completed" | "failed";
  created_at: number;
  completed_at?: number;
  video_url?: string;
  thumbnail_url?: string;
  error?: string;
  params: {
    orientation: string;
    size: string;
    duration: number;
    watermark: boolean;
    private: boolean;
    images: string[];
    character_url?: string;
    character_timestamps?: string;
  };
}

export interface TaskStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  success_rate: string;
}

export class TaskManager {
  private dbPath: string;
  private tasks: Task[] = [];
  private initialized = false;

  constructor(dbPath: string = "tasks.json") {
    this.dbPath = path.join(process.cwd(), dbPath);
  }

  /**
   * 初始化任务管理器，加载现有任务
   */
  async init(): Promise<void> {
    try {
      const data = await fs.readFile(this.dbPath, "utf-8");
      this.tasks = JSON.parse(data);
      this.initialized = true;
      console.error(`[TaskManager] 加载 ${this.tasks.length} 个任务`);
    } catch (error) {
      // 文件不存在，创建空任务列表
      this.tasks = [];
      this.initialized = true;
      await this.save();
      console.error("[TaskManager] 创建新的任务数据库");
    }
  }

  /**
   * 保存任务到文件
   */
  private async save(): Promise<void> {
    await fs.writeFile(this.dbPath, JSON.stringify(this.tasks, null, 2));
  }

  /**
   * 创建新任务
   */
  async createTask(
    id: string,
    prompt: string,
    params: CreateVideoRequest
  ): Promise<Task> {
    if (!this.initialized) {
      await this.init();
    }

    const task: Task = {
      id,
      prompt,
      status: "pending",
      created_at: Date.now(),
      params: {
        orientation: params.orientation,
        size: params.size,
        duration: params.duration,
        watermark: params.watermark,
        private: params.private,
        images: params.images,
        character_url: params.character_url,
        character_timestamps: params.character_timestamps,
      },
    };

    this.tasks.push(task);
    await this.save();

    console.error(`[TaskManager] 创建任务: ${id}`);
    return task;
  }

  /**
   * 更新任务状态
   */
  async updateTask(
    id: string,
    status: "pending" | "processing" | "completed" | "failed",
    data?: Partial<Omit<Task, "id" | "created_at" | "params">>
  ): Promise<Task | null> {
    if (!this.initialized) {
      await this.init();
    }

    const task = this.tasks.find((t) => t.id === id);
    if (!task) {
      console.error(`[TaskManager] 任务不存在: ${id}`);
      return null;
    }

    task.status = status;

    if (data) {
      if (data.completed_at !== undefined) task.completed_at = data.completed_at;
      if (data.video_url !== undefined) task.video_url = data.video_url;
      if (data.thumbnail_url !== undefined)
        task.thumbnail_url = data.thumbnail_url;
      if (data.error !== undefined) task.error = data.error;
    }

    if (status === "completed" || status === "failed") {
      task.completed_at = Date.now();
    }

    await this.save();
    console.error(`[TaskManager] 更新任务: ${id} -> ${status}`);
    return task;
  }

  /**
   * 获取单个任务
   */
  async getTask(id: string): Promise<Task | null> {
    if (!this.initialized) {
      await this.init();
    }

    return this.tasks.find((t) => t.id === id) || null;
  }

  /**
   * 获取所有任务
   */
  async getAllTasks(): Promise<Task[]> {
    if (!this.initialized) {
      await this.init();
    }

    return [...this.tasks].sort((a, b) => b.created_at - a.created_at);
  }

  /**
   * 获取任务统计
   */
  async getStats(): Promise<TaskStats> {
    if (!this.initialized) {
      await this.init();
    }

    const stats = {
      total: this.tasks.length,
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      success_rate: "0%",
    };

    this.tasks.forEach((task) => {
      stats[task.status]++;
    });

    const successRate =
      stats.total > 0
        ? ((stats.completed / stats.total) * 100).toFixed(1)
        : "0";
    stats.success_rate = `${successRate}%`;

    return stats;
  }

  /**
   * 获取未完成的任务（等待和进行中）
   */
  async getPendingTasks(): Promise<Task[]> {
    if (!this.initialized) {
      await this.init();
    }

    return this.tasks.filter(
      (t) => t.status === "pending" || t.status === "processing"
    );
  }

  /**
   * 批量更新任务状态
   */
  async batchUpdateStatus(taskIds: string[]): Promise<{
    updated: string[];
    errors: { id: string; error: string }[];
    results: (Task | null)[];
  }> {
    const results = await Promise.allSettled(
      taskIds.map(async (id) => {
        // 注意：这里需要传入完整的任务数据，实际使用时会从API获取
        return { id, success: true };
      })
    );

    const updated: string[] = [];
    const errors: { id: string; error: string }[] = [];
    const taskResults: (Task | null)[] = [];

    results.forEach((result, index) => {
      const id = taskIds[index];
      if (result.status === "fulfilled") {
        updated.push(id);
      } else {
        errors.push({ id, error: String(result.reason) });
      }
    });

    return { updated, errors, results: taskResults };
  }
}