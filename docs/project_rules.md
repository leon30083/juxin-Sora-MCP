# 《project_rules.md》

## 命名与目录
- 英文命名代码、中文命名文档；工具固定名：`create_character`、`generate_video`、`get_task_status`。
- 目录：`src/client`（HTTP 与鉴权）、`src/tools`（MCP 工具）、`src/types`（Schema）、`src/utils`（错误与重试）、`tests`、`docs`。

## MCP 专项规则
- 所有工具必须声明 `inputSchema`（Draft-07），并提供 `outputSchema`。
- 返回必须包含 `structuredContent` 与文本块 JSON 序列化（向后兼容）。
- 工具级错误统一 `{ isError: true, code: int, message: string }`；避免使用协议层错误。
- 服务器暴露 `tools/list`、处理 `tools/call`；提供 `server` 元信息（name/version/title）。
- 首选 `stdio` 传输；HTTP 授权遵循 MCP 建议（Bearer/OAuth/Key）。
- 素材管理：统一接入聚鑫图床；工具输入允许 `url/base64`，内部归一为图床URL后再调用业务接口。

## 代码与安全
- 严禁密钥进仓；仅用环境变量。
- 错误对象允许携带 `raw`（截断与脱敏）。
- 日志打点：`endpoint`、`latency_ms`、`status`、`retries`。

## 依赖与风格
- TypeScript；HTTP 使用 `fetch`/`axios`。
- ESLint/Prettier；最少注释优先（复杂逻辑才注释）。

## 配置与环境变量
- 使用环境变量：`API_BASE_URL`、`API_KEY`、`API_KEY_HEADER`、`CHARACTER_CREATE_PATH`、`VIDEO_CREATE_PATH`、`TASK_STATUS_PATH`、`ASSET_UPLOAD_PATH`。
- 端点默认遵循文档，可通过环境覆盖。

## 仓库治理
- `.gitignore` 忽略本地资料目录：`开发资料夹-用户存放资料/`
- 禁止密钥入库；仅使用环境变量或客户端配置注入；提交前检查变更不包含敏感信息。

## 测试与文档
- 覆盖三工具的正反路径与结构化输出一致性。
- `docs/` 保持《标准开发文档》《部署手册》《测试报告》。
