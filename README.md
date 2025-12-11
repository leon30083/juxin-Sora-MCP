# 聚鑫 Sora-2 MCP 服务器

这是一个 MCP (Model Context Protocol) 服务器，集成了聚鑫的 Sora-2 API，允许你通过对话生成视频。

## 功能特点

- 🎬 **文生视频**: 通过文字描述生成视频
- 🖼️ **图生视频**: 使用参考图片生成视频
- ⏱️ **进度跟踪**: 实时查询视频生成进度
- 🔄 **异步处理**: 支持异步生成和同步等待
- 🎯 **错误处理**: 完善的错误处理和重试机制

## 安装

### 1. 克隆或下载项目

```bash
git clone https://github.com/yourusername/juxin_mcp.git
cd juxin_mcp
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制 `.env.example` 文件为 `.env`：

```bash
cp .env.example .env
```

编辑 `.env` 文件，设置你的聚鑫API密钥：

```env
# 聚鑫API配置
JUXIN_API_KEY=你的API密钥
JUXIN_API_BASE_URL=https://api.jxincm.cn

# MCP服务器配置
MCP_SERVER_NAME=juxin-mcp-server
MCP_SERVER_VERSION=1.0.0
```

> 💡 **提示**: 你可以使用测试密钥 `sk-Q6DwAtsNvutSlaZXYAzXR39pUmwKHAHDgll0QifCL5GbwJd7`

### 4. 构建项目

```bash
npm run build
```

## 在 Claude Desktop 中使用

### 1. 配置 Claude Desktop

编辑 Claude Desktop 的配置文件：

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

添加以下配置：

```json
{
  "mcpServers": {
    "juxin": {
      "command": "node",
      "args": ["E:\\User\\GitHub\\Juxin_mcp\\dist\\index.js"],
      "env": {
        "JUXIN_API_KEY": "你的API密钥"
      }
    }
  }
}
```

> ⚠️ **注意**: 请将路径 `"E:\\User\\GitHub\\Juxin_mcp\\dist\\index.js"` 替换为你的实际项目路径。

### 2. 重启 Claude Desktop

配置完成后，重启 Claude Desktop 以加载新的MCP服务器。

## 使用方法

### 创建视频（文生视频）

```
请帮我创建一个视频：一只橘猫在樱花树下玩耍，竖屏格式
```

### 创建视频（图生视频）

```
请使用这张图片创建视频：https://example.com/image.jpg，描述为：让照片中的人物微笑挥手
```

### 查询视频状态

```
查询任务ID为 "sora-2:task_01k9008rhbefnt3rb1g9szxdwr" 的视频生成状态
```

## 可用工具

### create_video

创建视频生成任务。

**参数**:
- `prompt` (必需): 视频生成的提示词
- `orientation` (可选): 视频方向，"portrait"(竖屏) 或 "landscape"(横屏16:9)，**默认 "landscape"**
- `size` (可选): 视频尺寸，"small"(720p) 或 "large"(1080p)，默认 "small"
- `images` (可选): 参考图片URL数组，默认空数组（文生视频）
- `duration` (可选): 视频时长，目前仅支持10秒
- `watermark` (可选): 是否添加水印，**默认 false（无水印）**
- `private` (可选): 是否隐藏视频，默认 true
- `wait_for_completion` (可选): 是否等待完成，默认 false

**示例**:
```
创建一个视频：夕阳下的海滩，海浪轻拍沙滩，15秒
```
或
```
创建一个视频：城市夜景，车流穿梭，横屏15秒，1080p，无水印
```

### query_video_status

查询视频生成任务状态。

**参数**:
- `task_id` (必需): 任务ID

**示例**:
```
查询任务 sora-2:task_01k9008rhbefnt3rb1g9szxdwr 的状态
```

## 开发指南

### 本地开发

```bash
# 安装依赖
npm install

# 开发模式运行
npm run dev

# 构建项目
npm run build

# 运行测试
npm test
```

### 使用 MCP Inspector 测试

```bash
npx @modelcontextprotocol/inspector dist/index.js
```

这会启动一个网页界面，你可以测试所有的MCP工具。

## API 参考

### 聚鑫 Sora-2 API

- **创建视频**: `POST /v1/video/create`
- **查询任务**: `GET /v1/video/query`

### 状态说明

- `pending`: 任务排队中
- `processing`: 正在生成
- `completed`: 生成完成
- `failed`: 生成失败

## 常见问题

### Q: 视频生成需要多长时间？
A: 通常需要1-10分钟，取决于队列长度和视频复杂度。

### Q: 支持哪些视频格式？
A: 目前支持 MP4 格式，分辨率为 720p 或 1080p。

### Q: 生成的视频有水印吗？
A: 默认优先无水印，如果出错会自动使用有水印版本。设置 `watermark: false` 可强制无水印。

### Q: API调用有限制吗？
A: 有频率限制，请避免过于频繁的调用。

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 支持

如果遇到问题，请：
1. 检查 API 密钥是否正确
2. 查看控制台日志
3. 提交 Issue 到项目仓库