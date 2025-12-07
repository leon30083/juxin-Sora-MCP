import { postJson, authHeaders } from "../client/http";
import { makeError, StructuredResult } from "../utils/errors";
import { withRetries } from "../utils/retry";
import { endpoints } from "../client/endpoints";
import { uploadAsset } from "../client/upload";
import { isJuxinHost } from "../utils/url";
import { generateVideoOutputSchema } from "../types/schemas";

type Input = {
  prompt: string;
  model: "sora-2" | "sora-2-pro";
  images?: string[];
  character_url?: string;
  character_timestamps?: string;
  aspect_ratio?: string;
  duration?: number;
  resolution?: string;
  seed?: number;
  negative_prompt?: string;
};

type Output = { task_id: string };

export async function generateVideoTool(input: Input): Promise<StructuredResult<Output> | StructuredResult<any>> {
  const base = process.env.API_BASE_URL || "";
  if (!base) return { content: [{ type: "text", text: JSON.stringify(makeError(500, "missing API_BASE_URL")) }], structuredContent: makeError(500, "missing API_BASE_URL") } as any;
  if (!input.prompt || !input.model) return { content: [{ type: "text", text: JSON.stringify(makeError(400, "prompt and model required")) }], structuredContent: makeError(400, "prompt and model required") } as any;
  const ep = endpoints();
  const endpoint = `${base}${ep.videoCreate}`;
  let images = input.images || [];
  const normImages: string[] = [];
  for (const img of images) {
    if (img && !isJuxinHost(img)) {
      try {
        const u = await uploadAsset({ type: "url", kind: "image", value: img });
        normImages.push(u);
      } catch (e: any) {
        const err = makeError(500, e?.message || "image upload failed");
        return { content: [{ type: "text", text: JSON.stringify(err) }], structuredContent: err } as any;
      }
    } else if (img) {
      normImages.push(img);
    }
  }
  let characterUrl = input.character_url;
  if (characterUrl && !isJuxinHost(characterUrl)) {
    try {
      characterUrl = await uploadAsset({ type: "url", kind: "video", value: characterUrl });
    } catch (e: any) {
      const err = makeError(500, e?.message || "character upload failed");
      return { content: [{ type: "text", text: JSON.stringify(err) }], structuredContent: err } as any;
    }
  }
  try {
    const payload: any = {
      model: input.model,
      prompt: input.prompt,
      images: normImages,
    };
    if (typeof input.duration === "number") payload.duration = input.duration;
    if (typeof input.seed === "number") payload.seed = input.seed;
    if (input.resolution) payload.resolution = input.resolution;
    if (input.negative_prompt) payload.negative_prompt = input.negative_prompt;
    if (characterUrl) payload.character_url = characterUrl;
    if (input.character_timestamps) payload.character_timestamps = input.character_timestamps;
    const resp = await withRetries(() => postJson<any>(endpoint, payload, authHeaders()));
    const out: Output = { task_id: String(resp.task_id || resp.id || "") };
    const text = JSON.stringify(out);
    return { content: [{ type: "text", text }], structuredContent: out };
  } catch (e: any) {
    const err = makeError(500, e?.message || "request failed");
    return { content: [{ type: "text", text: JSON.stringify(err) }], structuredContent: err } as any;
  }
}
