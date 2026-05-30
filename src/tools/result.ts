export interface ToolResult {
  ok: boolean;
  content: string;
  data?: unknown;
  error?: string;
}

export function okResult(content: string, data?: unknown): ToolResult {
  return { ok: true, content, data };
}

export function errorResult(error: string): ToolResult {
  return { ok: false, content: "", error };
}
