# 聚鑫 Sora 2 MCP Server

- 工具：`create_character`、`generate_video`、`get_task_status`
- 环境变量：`API_BASE_URL`、`API_KEY`
- 规范：严格遵循 MCP Tools 规范，返回同时包含结构化结果与文本序列化 JSON。
 - 素材：统一通过聚鑫图床归一，支持 URL/Base64 输入，内部自动上传并返回可访问 URL。

## 使用
- 设置 `API_BASE_URL` 与 `API_KEY`（例如：`API_BASE_URL=https://api.jxincm.cn`）。
- 可选端点覆盖：
  - `CHARACTER_CREATE_PATH`（默认 `/sora/v1/characters`）
  - `VIDEO_CREATE_PATH`（默认 `/v1/video/create`）
  - `VIDEO_CREATE_PRO_PATH`（默认 `/v1/video/create`）
  - `VIDEO_CREATE_WITH_CHARACTER_PATH`（默认 `/v1/video/create`）
  - `TASK_STATUS_PATH`（默认 `/v1/videos`，用于 OpenAI官方视频格式查询）
  - `ASSET_UPLOAD_PATH`（默认 `/v1/assets/upload`）
- 通过 MCP 客户端调用对应工具并传入 JSON 参数。

## 快速验证
- PowerShell 设置环境变量并发起生成：
  - `Set-Item -Path Env:API_BASE_URL -Value https://api.jxincm.cn`
  - `Set-Item -Path Env:API_KEY -Value <YOUR_API_KEY>`
  - `powershell -ExecutionPolicy Bypass -File tests/quick-generate.ps1`
- 查询任务状态并取视频链接：
  - `powershell -ExecutionPolicy Bypass -File tests/quick-status.ps1`
- 一键生成并轮询直到拿到 `video_url`：
  - `powershell -ExecutionPolicy Bypass -File tests/quick-all.ps1`
- 修改生成参数：编辑 `tests/quick-generate.ps1` 的 `model/prompt/duration/size` 等字段；如需角色驱动，先用 `create_character` 创建并在生成时添加 `character_url` 与 `character_timestamps`。

## MCP 工具交互（持续跟进）
- 新增工具：`generate_and_follow`，入参与 `generate_video` 一致，内部自动轮询并在结构化输出中返回：
  - `task_id`、`final_status`、`video_url`（成功时）
  - `updates`（数组，记录每次查询的 `status`/`progress`/`video_url` 变化）

## 文档
- `docs/标准开发文档.md`
- `docs/project_rules.md`
