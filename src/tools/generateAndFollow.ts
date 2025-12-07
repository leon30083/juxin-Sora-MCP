import { makeError, StructuredResult } from "../utils/errors";
import { endpoints } from "../client/endpoints";
import { authHeaders, postJson, getJson } from "../client/http";
import { uploadAsset } from "../client/upload";
import { isJuxinHost } from "../utils/url";

type Input = {
  prompt: string;
  model: "sora-2" | "sora-2-pro";
  images?: string[];
  character_url?: string;
  character_timestamps?: string;
  duration?: number;
  size?: "large" | "small";
  resolution?: string;
  seed?: number;
  negative_prompt?: string;
  poll_interval_seconds?: number;
  max_minutes?: number;
};

type Update = { status: string; video_url?: string | null; status_update_time?: number | null; progress?: number | null };

type Output = { task_id: string; final_status: string; video_url?: string; updates: Update[] };

export async function generateAndFollowTool(input: Input): Promise<StructuredResult<Output> | StructuredResult<any>> {
  const base = process.env.API_BASE_URL || "";
  if (!base) return { content: [{ type: "text", text: JSON.stringify(makeError(500, "missing API_BASE_URL")) }], structuredContent: makeError(500, "missing API_BASE_URL") } as any;
  if (!input.prompt || !input.model) return { content: [{ type: "text", text: JSON.stringify(makeError(400, "prompt and model required")) }], structuredContent: makeError(400, "prompt and model required") } as any;
  const ep = endpoints();
  const endpoint = `${base}${ep.videoCreate}`;

  const normImages: string[] = [];
  if (input.images && input.images.length) {
    for (const img of input.images) {
      if (img && !isJuxinHost(img)) {
        const u = await uploadAsset({ type: "url", kind: "image", value: img });
        normImages.push(u);
      } else if (img) {
        normImages.push(img);
      }
    }
  }

  let characterUrl = input.character_url;
  if (characterUrl && !isJuxinHost(characterUrl)) {
    characterUrl = await uploadAsset({ type: "url", kind: "video", value: characterUrl });
  }

  const payload: any = { model: input.model, prompt: input.prompt };
  if (normImages.length) payload.images = normImages;
  if (typeof input.duration === "number") payload.duration = input.duration;
  if (input.size) payload.size = input.size;
  if (typeof input.seed === "number") payload.seed = input.seed;
  if (input.resolution) payload.resolution = input.resolution;
  if (input.negative_prompt) payload.negative_prompt = input.negative_prompt;
  if (characterUrl) payload.character_url = characterUrl;
  if (input.character_timestamps) payload.character_timestamps = input.character_timestamps;

  try {
    const createResp = await postJson<any>(endpoint, payload, authHeaders());
    const taskId = String(createResp.task_id || createResp.id || "");
    if (!taskId) {
      const err = makeError(500, "missing task id");
      return { content: [{ type: "text", text: JSON.stringify(err) }], structuredContent: err } as any;
    }

    const interval = input.poll_interval_seconds ?? 6;
    const maxMinutes = input.max_minutes ?? 8;
    const deadline = Date.now() + maxMinutes * 60 * 1000;
    const updates: Update[] = [];

    let finalStatus = "pending";
    let finalVideoUrl: string | undefined;
    const statusEndpointBase = `${base}${ep.taskStatus}`;

    while (Date.now() < deadline) {
      const statusUrl = `${statusEndpointBase}/${encodeURIComponent(taskId)}`;
      const statusResp = await getJson<any>(statusUrl, authHeaders());
      const status = String(statusResp.status || "pending");
      const videoUrl = (statusResp.video_url ?? null) as string | null;
      let progRaw: any = statusResp.progress;
      let prog: number | null = null;
      if (typeof progRaw === "number") {
        prog = progRaw <= 1 ? Math.round(progRaw * 100) : Math.round(progRaw);
      }
      const upd: Update = {
        status,
        video_url: videoUrl,
        status_update_time: (statusResp.status_update_time ?? null) as number | null,
        progress: prog
      };
      updates.push(upd);

      if (videoUrl) {
        finalStatus = status;
        finalVideoUrl = videoUrl || undefined;
        break;
      }
      if (status === "failed") {
        finalStatus = status;
        break;
      }
      await new Promise((r) => setTimeout(r, interval * 1000));
    }

    const out: Output = { task_id: taskId, final_status: finalStatus, video_url: finalVideoUrl, updates };
    const text = JSON.stringify(out);
    return { content: [{ type: "text", text }], structuredContent: out };
  } catch (e: any) {
    const err = makeError(500, e?.message || "request failed");
    return { content: [{ type: "text", text: JSON.stringify(err) }], structuredContent: err } as any;
  }
}
