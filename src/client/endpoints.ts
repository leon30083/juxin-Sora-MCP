export type EndpointConfig = {
  characterCreate: string;
  videoCreate: string;
  videoCreatePro: string;
  videoCreateWithCharacter: string;
  taskStatus: string; // use placeholder, append query ?id=
};

export function endpoints(): EndpointConfig {
  const env = (name: string, def: string) => process.env[name] || def;
  return {
    characterCreate: env("CHARACTER_CREATE_PATH", "/sora/v1/characters"),
    videoCreate: env("VIDEO_CREATE_PATH", "/v1/video/create"),
    videoCreatePro: env("VIDEO_CREATE_PRO_PATH", "/v1/video/create"),
    videoCreateWithCharacter: env("VIDEO_CREATE_WITH_CHARACTER_PATH", "/v1/video/create"),
    taskStatus: env("TASK_STATUS_PATH", "/v1/videos")
  };
}
