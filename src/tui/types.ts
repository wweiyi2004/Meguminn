export type TUIMessageType = "user" | "assistant" | "tool_call" | "tool_result" | "thought" | "plan" | "error" | "system";

export interface TUIMessage {
  id: string;
  type: TUIMessageType;
  content: string;
  timestamp: Date;
  toolName?: string;
  toolInput?: Record<string, unknown>;
  toolResult?: string;
  toolOk?: boolean;
  todos?: Array<{ content: string; status: string }>;
}

export interface TUIState {
  messages: TUIMessage[];
  isLoading: boolean;
  loadingText: string;
  model: string;
  cwd: string;
  sessionId: string;
  step: number;
  maxSteps: number;
}
