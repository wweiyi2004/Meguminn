import type { LLMProvider, Message, ChatOptions, StreamChunk } from "./types.js";

interface OpenAIProviderConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

interface OpenAIChatResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
}

export class OpenAICompatibleProvider implements LLMProvider {
  readonly maxContextTokens = 128000;
  private config: OpenAIProviderConfig;

  constructor(config: OpenAIProviderConfig) {
    this.config = config;
  }

  async chat(messages: Message[], options?: ChatOptions): Promise<string> {
    const model = options?.model ?? this.config.model;
    const temperature = options?.temperature ?? this.config.temperature;
    const maxTokens = options?.maxTokens ?? this.config.maxTokens;

    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stop: options?.stop,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LLM API error (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as OpenAIChatResponse;
    const choice = data.choices[0];

    if (!choice) {
      throw new Error("LLM API returned no choices");
    }

    return choice.message.content;
  }

  async *streamChat(messages: Message[], options?: ChatOptions): AsyncIterable<StreamChunk> {
    const model = options?.model ?? this.config.model;
    const temperature = options?.temperature ?? this.config.temperature;
    const maxTokens = options?.maxTokens ?? this.config.maxTokens;

    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: true,
        stop: options?.stop,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      yield { type: "error", error: `LLM API error (${response.status}): ${errorText}` };
      return;
    }

    if (!response.body) {
      yield { type: "error", error: "No response body" };
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;

          const data = trimmed.slice(6);
          if (data === "[DONE]") {
            yield { type: "done" };
            return;
          }

          try {
            const parsed = JSON.parse(data) as {
              choices?: Array<{ delta?: { content?: string } }>;
            };
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              yield { type: "text", content };
            }
          } catch {
            // skip malformed JSON lines
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    yield { type: "done" };
  }
}
