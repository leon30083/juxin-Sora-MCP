import { authHeaders, postJson } from "./http";
import { AssetInput } from "../types/assets";

export async function uploadAsset(asset: AssetInput): Promise<string> {
  const base = process.env.API_BASE_URL || "";
  const path = process.env.ASSET_UPLOAD_PATH || "/v1/assets/upload";
  if (!base) throw new Error("missing API_BASE_URL");
  const url = `${base}${path}`;
  const body = { type: asset.type, kind: asset.kind, value: asset.value, filename: asset.filename, mime: asset.mime };
  const resp = await postJson<any>(url, body, authHeaders());
  const out = resp.url || resp.data?.url || resp.location;
  if (!out) throw new Error("upload failed: no url");
  return String(out);
}
