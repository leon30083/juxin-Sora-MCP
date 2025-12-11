export const createCharacterInputSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  properties: {
    video_url: { type: "string", format: "uri" },
    video_base64: { type: "string" },
    name: { type: "string" },
    notes: { type: "string" }
  },
  oneOf: [{ required: ["video_url"] }, { required: ["video_base64"] }]
} as const;

export const createCharacterOutputSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  properties: {
    character_id: { type: "string" },
    reference_video_url: { type: "string", format: "uri" }
  },
  required: ["character_id"]
} as const;

export const generateVideoInputSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  properties: {
    prompt: { type: "string" },
    model: { type: "string", enum: ["sora-2", "sora-2-pro"] },
    character_id: { type: "string" },
    aspect_ratio: { type: "string" },
    duration: { type: "number", minimum: 1 },
    resolution: { type: "string" },
    seed: { type: "number" },
    negative_prompt: { type: "string" }
  },
  required: ["prompt", "model"]
} as const;

export const generateVideoOutputSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  properties: {
    task_id: { type: "string" }
  },
  required: ["task_id"]
} as const;

export const getTaskStatusInputSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  properties: {
    task_id: { type: "string" }
  },
  required: ["task_id"]
} as const;

export const getTaskStatusOutputSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  properties: {
    status: { type: "string", enum: ["pending", "processing", "succeeded", "failed"] },
    progress: { type: "number", minimum: 0, maximum: 100 },
    video_url: { type: "string", format: "uri" },
    thumbnail_url: { type: "string", format: "uri" },
    error_code: { type: "integer" },
    error_message: { type: "string" }
  },
  required: ["status"]
} as const;
