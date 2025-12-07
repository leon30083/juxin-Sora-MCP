# 《标准开发文档》（严格遵循 MCP 标准，修正角色创建为视频）

## 关键修正
- 依据聚鑫文档，Sora 2 的“角色创建”以参考视频为依据，不是图片。
- Tool A 的入参改为参考视频（URL 或 Base64），并以此生成 `character_id`。

## 权威规范与引用（MCP）
- Tools 规范（输入 / 输出 / 结构化结果 / 错误）：https://modelcontextprotocol.io/specification/draft/server/tools
- Overview 与消息模型（JSON-RPC 2.0 / 错误码规则）：https://modelcontextprotocol.io/specification/2025-06-18/basic
- Schema Reference（工具 annotations / outputSchema / 结果承载）：https://modelcontextprotocol.io/specification/2025-06-18/schema
- 架构总览（传输 / 授权 / 工具注册与通知）：https://modelcontextprotocol.io/docs/learn/architecture

## 权威文档与引用（业务接口）
- 接入点与鉴权：[代理接口调用地址](https://juxinapi.apifox.cn/doc-7302533.md)
- 状态码说明：[状态码说明](https://juxinapi.apifox.cn/doc-7487474.md)
- 创建角色（以视频为参考）：[sora 视频生成 > 创建角色](https://juxinapi.apifox.cn/api-377800347.md)
- 创建视频（纯提示）：[sora-2](https://juxinapi.apifox.cn/api-360463275.md) / [sora-2-pro](https://juxinapi.apifox.cn/api-377800348.md)
- 创建视频（带角色）：[统一视频格式 > 创建视频（带 Character）](https://juxinapi.apifox.cn/api-377800349.md)
- 查询任务：[统一视频格式 > 查询任务](https://juxinapi.apifox.cn/api-358967589.md)

## MCP 合规点
- JSON-RPC 2.0；`tools/list` 暴露工具，`tools/call` 调用工具。
- 所有工具声明 `inputSchema`（Draft-07）与 `outputSchema`。
- 返回包含 `structuredContent` 与文本 JSON 序列化（向后兼容）。
- 工具级错误：`isError: true`，`code` 为整数，`message` 为字符串。

## 工具设计（修正版）

### Tool A：`create_character`
- 描述：上传参考视频并注册为“角色”，返回 `character_id`。
- inputSchema（Draft-07）：
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "video_url": { "type": "string", "format": "uri" },
    "video_base64": { "type": "string" },
    "name": { "type": "string" },
    "notes": { "type": "string" }
  },
  "oneOf": [
    { "required": ["video_url"] },
    { "required": ["video_base64"] }
  ]
}
```
- outputSchema：
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "character_id": { "type": "string" },
    "reference_video_url": { "type": "string", "format": "uri" }
  },
  "required": ["character_id"]
}
```
- 字段确认：具体请求体字段名与响应体路径以 Apifox 文档为准（示例可能为 `video_url` / `video`，响应为 `character_id`）。
- 结构化返回与错误返回遵循 MCP 规范。

### Tool B：`generate_video`
- 描述：生成视频（纯提示词或角色驱动）。
- inputSchema：
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "prompt": { "type": "string" },
    "model": { "type": "string", "enum": ["sora-2", "sora-2-pro"] },
    "character_id": { "type": "string" },
    "aspect_ratio": { "type": "string" },
    "duration": { "type": "number", "minimum": 1 },
    "resolution": { "type": "string" },
    "seed": { "type": "number" },
    "negative_prompt": { "type": "string" }
  },
  "required": ["prompt", "model"]
}
```
- outputSchema：
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "task_id": { "type": "string" }
  },
  "required": ["task_id"]
}
```
- 分流：有 `character_id` 走“带 Character”端点；无则走 `sora-2`/`sora-2-pro` 端点。

### Tool C：`get_task_status`
- 描述：轮询查询任务状态与结果链接。
- inputSchema：
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "task_id": { "type": "string" }
  },
  "required": ["task_id"]
}
```
- outputSchema：
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "status": { "type": "string", "enum": ["pending", "processing", "succeeded", "failed"] },
    "progress": { "type": "number", "minimum": 0, "maximum": 100 },
    "video_url": { "type": "string", "format": "uri" },
    "thumbnail_url": { "type": "string", "format": "uri" },
    "error_code": { "type": "integer" },
    "error_message": { "type": "string" }
  },
  "required": ["status"]
}
```

## 流程与治理
- 角色创建（参考视频）→ 生成视频（分流）→ 查询任务（轮询、超时与重试）。
- 安全：环境变量注入；不记录密钥；错误与日志脱敏。
- 错误治理：工具级错误返回；429/5xx 退避重试；4xx 参数错误直接提示。

---

# 《project_rules.md》
- 代码英文、文档中文；工具固定名；目录：`src/client`、`src/tools`、`src/types`、`src/utils`、`tests`、`docs`。
- MCP 规则：所有工具声明 `inputSchema` 与 `outputSchema`；返回含 `structuredContent` 与文本块 JSON；错误 `{ isError: true, code: int, message: string }`。
- 业务规则：角色创建使用参考视频字段（按 Apifox 确认）；生成端点按是否有 `character_id` 分流；查询任务解析统一视频格式响应路径。

---

## 下一步
- 请您审阅以上修正后的《标准开发文档》与《project_rules.md》。若内容无误，请回复“确认”，我将开始按 MCP 标准进行开发与实现。