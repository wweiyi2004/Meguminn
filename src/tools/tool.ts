import type { ZodType } from "zod/v4";
import type { ToolResult } from "./result.js";

export type RiskLevel = "safe" | "write" | "command" | "dangerous";

export interface ToolContext {
  cwd: string;
  sessionId: string;
  autoConfirm: boolean;
}

export interface Tool {
  name: string;
  description: string;
  inputSchema: ZodType;
  riskLevel: RiskLevel;
  execute(input: Record<string, unknown>, context: ToolContext): Promise<ToolResult>;
}
