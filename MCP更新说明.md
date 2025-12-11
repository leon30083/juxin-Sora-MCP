# 聚鑫 Sora-2 MCP 工具更新说明

## 更新时间
2025年12月10日

## 更新内容

### 1. 默认设置调整

#### ✅ 修改前
- 默认方向：portrait（竖屏）
- 默认水印：true（有水印）
- 默认时长：10秒

#### ✅ 修改后
- **默认方向：landscape（横屏16:9）**
- **默认水印：false（无水印）**
- **默认时长：15秒**

### 2. 影响的文件

1. **源代码文件**：
   - `src/index.ts` - MCP服务器主文件
   - `types/juxin.ts` - TypeScript类型定义

2. **文档文件**：
   - `README.md` - 项目说明文档
   - `用户使用指南.md` - 用户教程

### 3. 更新详情

#### 3.1 水印设置
```typescript
// 修改前
watermark: z.boolean().default(true).describe("是否添加水印")

// 修改后
watermark: z.boolean().default(false).describe("是否添加水印，默认false为无水印")
```

#### 3.2 视频方向
```typescript
// 修改前
orientation: {
  type: "string",
  enum: ["portrait", "landscape"],
  default: "portrait"  // 竖屏
}

// 修改后
orientation: {
  type: "string",
  enum: ["portrait", "landscape"],
  default: "landscape"  // 横屏16:9
}
```

#### 3.3 视频时长
```typescript
// 修改前
duration: z.literal(10).describe("视频时长，目前支持10秒")

// 修改后
duration: z.union([z.literal(10), z.literal(15)])
          .default(15)
          .describe("视频时长（秒），支持10秒和15秒，默认15秒")
```

## 使用示例

### 简单使用（使用新默认）
```
用户: 创建一个视频：夕阳下的海滩，海浪轻拍
结果：横屏15秒无水印视频
```

### 自定义设置
```
用户: 创建一个视频：跳舞的小狗，竖屏10秒，要加水印
参数：orientation=portrait, duration=10, watermark=true
```

## 注意事项

1. **向后兼容**：用户仍可以明确指定参数来使用旧设置
2. **文档已更新**：所有示例和说明都已更新以反映新的默认值
3. **测试建议**：建议重新测试MCP工具以确保默认设置正确生效

## 优势

1. **更好的视觉体验**：横屏16:9更适合大多数显示器
2. **更干净的视频**：默认无水印让视频更专业
3. **更长的内容**：15秒可以包含更多内容和细节