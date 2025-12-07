# openai 编辑视频

## OpenAPI Specification

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /v1/videos/{id}/remix:
    post:
      summary: openai 编辑视频
      deprecated: false
      description: ''
      tags:
        - 默认模块/视频模型/sora 视频生成/OpenAI官方视频格式
      parameters:
        - name: id
          in: path
          description: ''
          required: true
          example: video_099c5197-abfd-4e16-88ff-1e162f2a5c77
          schema:
            type: string
        - name: Content-Type
          in: header
          description: ''
          required: true
          example: application/json
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                prompt:
                  type: string
              required:
                - prompt
              x-apifox-orders:
                - prompt
            example:
              prompt: 让这个视频背景变成紫色
      responses:
        '401':
          description: ''
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: object
                    properties:
                      message:
                        type: string
                      message_zh:
                        type: string
                      type:
                        type: string
                    required:
                      - message
                      - message_zh
                      - type
                    x-apifox-orders:
                      - message
                      - message_zh
                      - type
                required:
                  - error
                x-apifox-orders:
                  - error
              example:
                id: video_ffd746b3-3f44-4b48-8d4a-dd5a10261287
                object: video
                model: sora-2
                status: queued
                progress: 0
                created_at: 1761623275
                size: 720x720
                remixed_from_video_id: video_5c6a605a-30c0-4a6a-9dbd-d1d6cfdd9980
          headers: {}
          x-apifox-name: 成功
      security:
        - bearer: []
      x-apifox-folder: 默认模块/视频模型/sora 视频生成/OpenAI官方视频格式
      x-apifox-status: released
      x-run-in-apifox: https://app.apifox.com/web/project/7016580/apis/api-366402694-run
components:
  schemas: {}
  securitySchemes:
    bearer:
      type: http
      scheme: bearer
servers:
  - url: https://api.jxincm.cn
    description: 正式环境
security:
  - bearer: []

```