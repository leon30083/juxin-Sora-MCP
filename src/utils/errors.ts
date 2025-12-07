export type ToolError = { isError: true; code: number; message: string };

export function makeError(code: number, message: string): ToolError {
  return { isError: true, code, message };
}

export type StructuredResult<T> = {
  content: { type: "text"; text: string }[];
  structuredContent: T;
};
