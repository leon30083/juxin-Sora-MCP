import { getJson, authHeaders } from "../client/http";
import { makeError, StructuredResult } from "../utils/errors";
import { withRetries } from "../utils/retry";
import { endpoints } from "../client/endpoints";
import { getTaskStatusOutputSchema } from "../types/schemas";

type Input = { task_id: string };

type Output = {
  status: "pending" | "processing" | "succeeded" | "failed";
  progress?: number;
  video_url?: string;
  thumbnail_url?: string;
  error_code?: number;
  error_message?: string;
};

export async function getTaskStatusTool(input: Input): Promise<StructuredResult<Output> | StructuredResult<any>> {
  const base = process.env.API_BASE_URL || "";
  if (!base) return { content: [{ type: "text", text: JSON.stringify(makeError(500, "missing API_BASE_URL")) }], structuredContent: makeError(500, "missing API_BASE_URL") } as any;
  if (!input.task_id) return { content: [{ type: "text", text: JSON.stringify(makeError(400, "task_id required")) }], structuredContent: makeError(400, "task_id required") } as any;
  const ep = endpoints();
  const url = `${base}${ep.taskStatus}?id=${encodeURIComponent(input.task_id)}`;
  try {
    const resp = await withRetries(() => getJson<any>(url, authHeaders()));
    const out: Output = {
      status: String(resp.status || "pending") as Output["status"],
      progress: typeof resp.progress === "number" ? resp.progress : undefined,
      video_url: resp.video_url || (resp.data && resp.data.url) || undefined,
      thumbnail_url: resp.thumbnail_url || undefined,
      error_code: typeof resp.error_code === "number" ? resp.error_code : undefined,
      error_message: resp.error_message || undefined
    };
    const text = JSON.stringify(out);
    return { content: [{ type: "text", text }], structuredContent: out };
  } catch (e: any) {
    const err = makeError(500, e?.message || "request failed");
    return { content: [{ type: "text", text: JSON.stringify(err) }], structuredContent: err } as any;
  }
}
