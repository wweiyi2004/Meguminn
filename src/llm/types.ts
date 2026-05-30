export type Role = "system" | "user" | "assistant";

export interface Message {
  role: Role;
  content: string;
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stop?: string[];
}

export interface StreamChunk {
  type: "text" | "done" | "error";
  content?: string;
  error?: string;
}

export interface LLMProvider {
  chat(messages: Message[], options?: ChatOptions): Promise<string>;
  streamChat(messages: Message[], options?: ChatOptions): AsyncIterable<StreamChunk>;
  readonly maxContextTokens: number;
}
