export type AssetInput = {
  type: "url" | "base64";
  kind: "image" | "video";
  value: string;
  filename?: string;
  mime?: string;
};
