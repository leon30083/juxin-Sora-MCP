# openai 创建视频，带图片 私有模式

## OpenAPI Specification

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /v1/videos:
    post:
      summary: openai 创建视频，带图片 私有模式
      deprecated: false
      description: ''
      tags:
        - 默认模块/视频模型/sora 视频生成/OpenAI官方视频格式
      parameters: []
      requestBody:
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                model:
                  example: sora-2
                  type: string
                prompt:
                  example: 让牛快乐的跳科目三
                  type: string
                seconds:
                  example: '10'
                  type: string
                input_reference:
                  format: binary
                  type: string
                  example: file://C:\Users\Administrator\Desktop\场景1.png
                size:
                  example: 16x9
                  type: string
                watermark:
                  example: 'false'
                  type: string
                private:
                  example: 'true'
                  type: string
              required:
                - model
                - prompt
                - seconds
                - input_reference
                - size
                - watermark
            examples: {}
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                type: object
                properties:
                  id:
                    type: string
                  object:
                    type: string
                  model:
                    type: string
                  status:
                    type: string
                  progress:
                    type: integer
                  created_at:
                    type: integer
                  seconds:
                    type: string
                  size:
                    type: string
                required:
                  - id
                  - object
                  - model
                  - status
                  - progress
                  - created_at
                  - seconds
                  - size
                x-apifox-orders:
                  - id
                  - object
                  - model
                  - status
                  - progress
                  - created_at
                  - seconds
                  - size
              example:
                id: video_3fbdeb24-27db-422b-8bf3-5feb8acbc6a1
                object: video
                model: sora-2
                status: queued
                progress: 0
                created_at: 1761623154
                seconds: '10'
                size: 1280x720
          headers: {}
          x-apifox-name: 成功
      security:
        - bearer: []
      x-apifox-folder: 默认模块/视频模型/sora 视频生成/OpenAI官方视频格式
      x-apifox-status: released
      x-run-in-apifox: https://app.apifox.com/web/project/7016580/apis/api-377800352-run
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