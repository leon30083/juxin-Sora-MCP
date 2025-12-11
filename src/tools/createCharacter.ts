import { postJson, authHeaders } from "../client/http";
import { makeError, StructuredResult } from "../utils/errors";
import { withRetries } from "../utils/retry";
import { endpoints } from "../client/endpoints";
import { uploadAsset } from "../client/upload";
import { isJuxinHost } from "../utils/url";
import { createCharacterOutputSchema } from "../types/schemas";

type Input = { video_url?: string; video_base64?: string; timestamps?: string; name?: string; notes?: string };

type Output = { character_id: string; reference_video_url?: string };

export async function createCharacterTool(input: Input): Promise<StructuredResult<Output> | StructuredResult<any>> {
  const base = process.env.API_BASE_URL || "";
  if (!base) return { content: [{ type: "text", text: JSON.stringify(makeError(500, "missing API_BASE_URL")) }], structuredContent: makeError(500, "missing API_BASE_URL") } as any;
  const hasUrl = !!input.video_url;
  const hasB64 = !!input.video_base64;
  if (!hasUrl && !hasB64) return { content: [{ type: "text", text: JSON.stringify(makeError(400, "video required")) }], structuredContent: makeError(400, "video required") } as any;
  let finalUrl = input.video_url || "";
  if (hasUrl && !isJuxinHost(finalUrl)) {
    try {
      finalUrl = await uploadAsset({ type: "url", kind: "video", value: finalUrl });
    } catch (e: any) {
      const err = makeError(500, e?.message || "upload failed");
      return { content: [{ type: "text", text: JSON.stringify(err) }], structuredContent: err } as any;
    }
  }
  if (hasB64) {
    try {
      finalUrl = await uploadAsset({ type: "base64", kind: "video", value: input.video_base64! });
    } catch (e: any) {
      const err = makeError(500, e?.message || "upload failed");
      return { content: [{ type: "text", text: JSON.stringify(err) }], structuredContent: err } as any;
    }
  }
  const url = `${base}${endpoints().characterCreate}`;
  try {
    const payload: any = { url: finalUrl };
    if (input.timestamps) payload.timestamps = input.timestamps;
    const resp = await withRetries(() => postJson<any>(url, payload, authHeaders()));
    const out: Output = { character_id: String(resp.character_id || resp.id || ""), reference_video_url: finalUrl };
    const text = JSON.stringify(out);
    return { content: [{ type: "text", text }], structuredContent: out };
  } catch (e: any) {
    const err = makeError(500, e?.message || "request failed");
    return { content: [{ type: "text", text: JSON.stringify(err) }], structuredContent: err } as any;
  }
}
