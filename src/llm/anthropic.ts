import type { LLMProvider, Message, ChatOptions, StreamChunk } from "./types.js";

export class AnthropicProvider implements LLMProvider {
  readonly maxContextTokens = 200000;

  async chat(_messages: Message[], _options?: ChatOptions): Promise<string> {
    throw new Error("Anthropic provider is not yet implemented. Use openai-compatible provider.");
  }

  async *streamChat(_messages: Message[], _options?: ChatOptions): AsyncIterable<StreamChunk> {
    yield { type: "error", error: "Anthropic provider is not yet implemented." };
  }
}
