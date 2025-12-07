const { stdin, stdout, env } = process
let buf = ""
function send(id, result) {
  const msg = { jsonrpc: "2.0", id, result }
  stdout.write(JSON.stringify(msg) + "\n")
}
function sendError(id, code, message) {
  const msg = { jsonrpc: "2.0", id, error: { code, message } }
  stdout.write(JSON.stringify(msg) + "\n")
}
function requestJson(method, url, headers, body) {
  return new Promise((resolve, reject) => {
    try {
      const u = new URL(url)
      const isHttps = u.protocol === "https:"
      const mod = isHttps ? require("https") : require("http")
      const opts = {
        method,
        hostname: u.hostname,
        port: u.port || (isHttps ? 443 : 80),
        path: u.pathname + (u.search || ""),
        headers
      }
      const req = mod.request(opts, (res) => {
        let data = ""
        res.on("data", (chunk) => { data += chunk })
        res.on("end", () => {
          if (res.statusCode < 200 || res.statusCode >= 300) {
            return reject(new Error("http " + res.statusCode))
          }
          try {
            const json = data ? JSON.parse(data) : {}
            resolve(json)
          } catch (e) {
            reject(e)
          }
        })
      })
      req.on("error", reject)
      if (body) req.write(body)
      req.end()
    } catch (e) {
      reject(e)
    }
  })
}
async function postJson(url, body, headers) {
  const h = { "Content-Type": "application/json", ...headers }
  return await requestJson("POST", url, h, JSON.stringify(body))
}
async function getJson(url, headers) {
  const h = { ...headers }
  return await requestJson("GET", url, h, null)
}
function authHeaders() {
  const key = env.API_KEY || ""
  const header = env.API_KEY_HEADER || "Authorization"
  if (!key) return {}
  if (header.toLowerCase() === "authorization") return { Authorization: `Bearer ${key}` }
  const o = {}
  o[header] = key
  return o
}
function endpoints() {
  return {
    characterCreate: env.CHARACTER_CREATE_PATH || "/sora/v1/characters",
    videoCreate: env.VIDEO_CREATE_PATH || "/v1/video/create",
    taskStatus: env.TASK_STATUS_PATH || "/v1/videos",
    assetUpload: env.ASSET_UPLOAD_PATH || "/v1/assets/upload"
  }
}
async function uploadAsset(asset) {
  const base = env.API_BASE_URL || ""
  const ep = endpoints()
  const url = base + ep.assetUpload
  const body = { type: asset.type, kind: asset.kind, value: asset.value, filename: asset.filename, mime: asset.mime }
  const resp = await postJson(url, body, authHeaders())
  const out = resp.url || (resp.data && resp.data.url) || resp.location
  if (!out) throw new Error("upload failed")
  return String(out)
}
function listTools() {
  const tools = [
    {
      name: "create_character",
      description: "Create a Sora2 character from a reference video",
      inputSchema: {
        $schema: "http://json-schema.org/draft-07/schema#",
        type: "object",
        properties: { video_url: { type: "string", format: "uri" }, video_base64: { type: "string" }, timestamps: { type: "string" } },
        oneOf: [{ required: ["video_url"] }, { required: ["video_base64"] }]
      },
      outputSchema: {
        $schema: "http://json-schema.org/draft-07/schema#",
        type: "object",
        properties: { character_id: { type: "string" }, reference_video_url: { type: "string", format: "uri" } },
        required: ["character_id"]
      }
    },
    {
      name: "generate_video",
      description: "Generate video via unified format",
      inputSchema: {
        $schema: "http://json-schema.org/draft-07/schema#",
        type: "object",
        properties: {
          prompt: { type: "string" },
          model: { type: "string", enum: ["sora-2", "sora-2-pro"] },
          images: { type: "array", items: { type: "string" } },
          character_url: { type: "string" },
          character_timestamps: { type: "string" },
          duration: { type: "number" },
          orientation: { type: "string" }
        },
        required: ["prompt", "model"]
      },
      outputSchema: {
        $schema: "http://json-schema.org/draft-07/schema#",
        type: "object",
        properties: { task_id: { type: "string" } },
        required: ["task_id"]
      }
    },
    {
      name: "get_task_status",
      description: "Query task status and video url",
      inputSchema: {
        $schema: "http://json-schema.org/draft-07/schema#",
        type: "object",
        properties: { task_id: { type: "string" } },
        required: ["task_id"]
      },
      outputSchema: {
        $schema: "http://json-schema.org/draft-07/schema#",
        type: "object",
        properties: {
          status: { type: "string" },
          progress: { type: "number" },
          video_url: { type: "string" },
          error_code: { type: "integer" },
          error_message: { type: "string" }
        },
        required: ["status"]
      }
    },
    {
      name: "generate_and_follow",
      description: "Generate and automatically follow until video_url",
      inputSchema: {
        $schema: "http://json-schema.org/draft-07/schema#",
        type: "object",
        properties: {
          prompt: { type: "string" },
          model: { type: "string", enum: ["sora-2", "sora-2-pro"] },
          duration: { type: "number" },
          orientation: { type: "string" },
          poll_interval_seconds: { type: "number" },
          max_minutes: { type: "number" }
        },
        required: ["prompt", "model"]
      },
      outputSchema: {
        $schema: "http://json-schema.org/draft-07/schema#",
        type: "object",
        properties: { task_id: { type: "string" }, final_status: { type: "string" }, video_url: { type: "string" } },
        required: ["task_id", "final_status"]
      }
    }
    ,
    {
      name: "generate_and_follow_batch",
      description: "Generate multiple tasks concurrently and follow until video_url",
      inputSchema: {
        $schema: "http://json-schema.org/draft-07/schema#",
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                prompt: { type: "string" },
                model: { type: "string", enum: ["sora-2", "sora-2-pro"] },
                duration: { type: "number" },
                orientation: { type: "string" }
              },
              required: ["prompt", "model"]
            }
          },
          concurrency: { type: "number" },
          poll_interval_seconds: { type: "number" },
          max_minutes: { type: "number" }
        },
        required: ["items"]
      },
      outputSchema: {
        $schema: "http://json-schema.org/draft-07/schema#",
        type: "object",
        properties: {
          results: {
            type: "array",
            items: {
              type: "object",
              properties: { task_id: { type: "string" }, final_status: { type: "string" }, video_url: { type: "string" } },
              required: ["task_id", "final_status"]
            }
          }
        },
        required: ["results"]
      }
    }
  ]
  return { tools }
}
async function callTool(params) {
  const base = env.API_BASE_URL || ""
  if (!base) return { content: [{ type: "text", text: JSON.stringify({ isError: true, code: 500, message: "missing API_BASE_URL" }) }], structuredContent: { isError: true, code: 500, message: "missing API_BASE_URL" } }
  const ep = endpoints()
  const name = params.name
  const args = params.arguments || {}
  if (name === "create_character") {
    let url = args.video_url || ""
    if (args.video_base64) url = await uploadAsset({ type: "base64", kind: "video", value: args.video_base64 })
    else if (url && !/jxincm\.cn|filesystem\.site/.test(url)) url = await uploadAsset({ type: "url", kind: "video", value: url })
    const body = { url }
    if (args.timestamps) body.timestamps = args.timestamps
    const resp = await postJson(base + ep.characterCreate, body, authHeaders())
    const out = { character_id: String(resp.character_id || resp.id || ""), reference_video_url: url }
    return { content: [{ type: "text", text: JSON.stringify(out) }], structuredContent: out }
  }
  if (name === "generate_video") {
    const payload = { model: args.model, prompt: args.prompt }
    payload.duration = typeof args.duration === "number" ? args.duration : 15
    payload.orientation = args.orientation || "landscape"
    if (Array.isArray(args.images) && args.images.length) payload.images = args.images
    if (args.character_url) payload.character_url = args.character_url
    if (args.character_timestamps) payload.character_timestamps = args.character_timestamps
    const resp = await postJson(base + ep.videoCreate, payload, authHeaders())
    const out = { task_id: String(resp.task_id || resp.id || "") }
    return { content: [{ type: "text", text: JSON.stringify(out) }], structuredContent: out }
  }
  if (name === "get_task_status") {
    const url = base + ep.taskStatus + "/" + encodeURIComponent(args.task_id || "")
    const resp = await getJson(url, authHeaders())
    let prog = resp.progress
    if (typeof prog === "number") prog = prog <= 1 ? Math.round(prog * 100) : Math.round(prog)
    const out = { status: String(resp.status || "pending"), progress: prog || null, video_url: resp.video_url || null, error_code: resp.error_code || null, error_message: resp.error_message || null }
    return { content: [{ type: "text", text: JSON.stringify(out) }], structuredContent: out }
  }
  if (name === "generate_and_follow") {
    const createArgs = { model: args.model, prompt: args.prompt, duration: typeof args.duration === "number" ? args.duration : 15, orientation: args.orientation || "landscape" }
    const created = await postJson(base + ep.videoCreate, createArgs, authHeaders())
    const taskId = String(created.task_id || created.id || "")
    const interval = typeof args.poll_interval_seconds === "number" ? args.poll_interval_seconds : 6
    const maxMinutes = typeof args.max_minutes === "number" ? args.max_minutes : 8
    const deadline = Date.now() + maxMinutes * 60 * 1000
    const statusBase = base + ep.taskStatus
    let final = "pending"
    let link = undefined
    while (Date.now() < deadline) {
      const s = await getJson(statusBase + "/" + encodeURIComponent(taskId), authHeaders())
      if (s.video_url) { final = String(s.status || "succeeded"); link = s.video_url; break }
      if (String(s.status) === "failed") { final = "failed"; break }
      await new Promise(r => setTimeout(r, interval * 1000))
    }
    const out = { task_id: taskId, final_status: final, video_url: link }
    return { content: [{ type: "text", text: JSON.stringify(out) }], structuredContent: out }
  }
  if (name === "generate_and_follow_batch") {
    const items = Array.isArray(args.items) ? args.items : []
    const concurrency = typeof args.concurrency === "number" && args.concurrency > 0 ? Math.floor(args.concurrency) : 3
    const interval = typeof args.poll_interval_seconds === "number" ? args.poll_interval_seconds : 6
    const maxMinutes = typeof args.max_minutes === "number" ? args.max_minutes : 8
    const statusBase = base + ep.taskStatus
    const createBase = base + ep.videoCreate
    async function runOne(it) {
      const payload = { model: it.model, prompt: it.prompt, duration: typeof it.duration === "number" ? it.duration : 15, orientation: it.orientation || "landscape" }
      const created = await postJson(createBase, payload, authHeaders())
      const taskId = String(created.task_id || created.id || "")
      const deadline = Date.now() + maxMinutes * 60 * 1000
      let final = "pending"
      let link = undefined
      while (Date.now() < deadline) {
        const s = await getJson(statusBase + "/" + encodeURIComponent(taskId), authHeaders())
        if (s.video_url) { final = String(s.status || "succeeded"); link = s.video_url; break }
        if (String(s.status) === "failed") { final = "failed"; break }
        await new Promise(r => setTimeout(r, interval * 1000))
      }
      return { task_id: taskId, final_status: final, video_url: link }
    }
    const queue = items.slice()
    const running = []
    const results = []
    while (running.length < concurrency && queue.length) {
      const it = queue.shift()
      running.push(runOne(it).then(res => { results.push(res) }))
    }
    while (running.length) {
      await Promise.race(running)
      for (let i = running.length - 1; i >= 0; i--) {
        if (running[i].settled) running.splice(i, 1)
      }
      while (running.length < concurrency && queue.length) {
        const it = queue.shift()
        const p = runOne(it).then(res => { results.push(res) })
        running.push(p)
      }
      await Promise.all(running)
      break
    }
    const out = { results }
    return { content: [{ type: "text", text: JSON.stringify(out) }], structuredContent: out }
  }
  return { content: [{ type: "text", text: JSON.stringify({ isError: true, code: 404, message: "unknown tool" }) }], structuredContent: { isError: true, code: 404, message: "unknown tool" } }
}
stdin.setEncoding("utf8")
stdin.on("data", async (chunk) => {
  buf += chunk
  let idx
  while ((idx = buf.indexOf("\n")) >= 0) {
    const line = buf.slice(0, idx)
    buf = buf.slice(idx + 1)
    if (!line.trim()) continue
    let req
    try { req = JSON.parse(line) } catch { continue }
    const id = req.id
    const method = req.method
    if (method === "initialize") {
      const result = {
        protocolVersion: "2025-03-26",
        serverInfo: {
          name: "sora2-mcp",
          version: "0.1.0",
          annotations: { title: "Sora 2 MCP" }
        },
        capabilities: { tools: { listChanged: true } }
      }
      send(id, result)
      continue
    }
    if (method === "tools/list") {
      const res = listTools()
      send(id, res)
      continue
    }
    if (method === "tools/call") {
      try {
        const res = await callTool(req.params || {})
        send(id, res)
      } catch (e) {
        sendError(id, -32000, String(e && e.message || e))
      }
      continue
    }
    if (id === undefined) {
      continue
    }
    sendError(id, -32601, "method not found")
  }
})
