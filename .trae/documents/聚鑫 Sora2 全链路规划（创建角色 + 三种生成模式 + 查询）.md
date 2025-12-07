# 结论与策略
- 在 MCP 工具中，**需要对外部素材统一规范**：无论图片或视频来源（本地/Base64/第三方URL），都先归一为可访问的**聚鑫图床 URL**，再调用生成/角色创建接口。
- 这样可以确保素材可访问性、权限与审计一致，避免第三方链接失效或跨域问题。

# 统一资产层（Asset Normalization）
- 新增“资产归一化”子流程，工具内部透明执行：
  1. 接收素材（图片/视频）：支持 `url`、`base64`、或本地临时文件（客户端侧上传转Base64）。
  2. 上传到聚鑫图床（按“聚鑫在线文档”提供的上传API路径，配置化 `ASSET_UPLOAD_PATH`）。
  3. 返回聚鑫CDN URL（可长期访问）；失败时返回 MCP 工具级错误（整数 `code` + `message`）。
- 适用范围：
  - `create_character`：参考视频必须走图床，得到 `url` 再提交角色创建。
  - `generate_video_unified`：`images`（URL数组）与 `character_url` 统一走图床。
  - `generate_video_openai`：即使支持 multipart，也建议预上传素材到图床并以 URL 提交，减少直传开销；如用户坚持直传文件，保留multipart直传路径。
  - `generate_video_chat`：消息中引用素材时也先归一为图床 URL。

# 输入/输出规范（MCP Schema 扩展）
- 资产输入统一为 `asset` 对象（供三模式与角色创建共用）：
  - `type`: `url` | `base64`
  - `kind`: `image` | `video`
  - `value`: string（URL或Base64内容）
  - 可选：`filename`, `mime`
- 工具层转换为聚鑫图床 URL后，生成请求体仍遵循各模式的原生字段（如 `images[]`, `character_url`）。
- 输出：在 `structuredContent` 中额外返回 `normalizedAssets`（数组），便于审计与后续复用；同时文本块序列化JSON向后兼容。

# 配置与约束
- 环境变量：
  - `API_BASE_URL=https://api.jxincm.cn`
  - `ASSET_UPLOAD_PATH`（示例：`/v1/assets/upload`，具体以“聚鑫在线文档”为准）
  - 允许自定义密钥头 `API_KEY_HEADER`；默认 `Authorization: Bearer <API_KEY>`。
- 校验：
  - 视频不得包含真人（角色创建失败）；对文件大小、mime类型进行白名单校验（mp4、png/jpeg/webp等）。
  - URL 主机白名单（非图床或非HTTPS的第三方URL先走上传）。

# 端到端流程（含图床）
1. `create_character`：接收参考视频（`asset`）→ 上传图床 → 得到 `url` → `POST /sora/v1/characters`（含 `url`、`timestamps`）→ 返回 `id/username`。
2. `generate_video_unified`：接收 `images[]` 与可选 `character_url` 源（`asset`）→ 全部归一为图床URL → `POST /v1/video/create` → 返回 `task_id/id`。
3. `generate_video_openai`：优先归一素材为图床URL并作为字段提交；保留multipart备用路径 → `POST /v1/videos` → 返回 `id/status`。
4. `generate_video_chat`：消息引用素材先归一图床URL → `POST /v1/chat/completions`（项目指定代理路径）→ 返回任务标识。
5. `get_task_status`：按 `mode` 路由到对应查询接口，统一返回 `status`、`video_url`。

# 安全与可观测性
- 不记录密钥/原始Base64；日志仅记 `request_id`、`endpoint`、`latency_ms`、状态与重试次数。
- 对上传失败、额度不足、速率限制做指数退避与结构化错误回传。

# 后续实施
- 在 MCP 工具内实现“资产归一化”层与图床上传的可配置端点；
- 为四类工具补充 `asset` 输入支持与输出中的 `normalizedAssets`；
- 验证三模式生成与角色创建在统一图床策略下的端到端可用性。

## 请确认以上图床与资产归一化规范。如确认，我将据此将 MCP 工具接入聚鑫图床并实现统一素材管理。