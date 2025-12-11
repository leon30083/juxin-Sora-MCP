type Headers = Record<string, string>;

export async function postJson<T>(url: string, body: unknown, headers: Headers): Promise<T> {
  const h: Headers = { "Content-Type": "application/json", ...headers };
  const f: any = (globalThis as any).fetch;
  if (!f) throw new Error("fetch not available");
  const res = await f(url, { method: "POST", headers: h, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`http ${res.status}`);
  return (await res.json()) as T;
}

export async function getJson<T>(url: string, headers: Headers): Promise<T> {
  const h: Headers = { ...headers };
  const f: any = (globalThis as any).fetch;
  if (!f) throw new Error("fetch not available");
  const res = await f(url, { method: "GET", headers: h });
  if (!res.ok) throw new Error(`http ${res.status}`);
  return (await res.json()) as T;
}

export function authHeaders(): Headers {
  const key = process.env.API_KEY || "";
  const header = process.env.API_KEY_HEADER || "Authorization";
  if (!key) return {};
  if (header.toLowerCase() === "authorization") return { Authorization: `Bearer ${key}` };
  return { [header]: key } as Headers;
}
