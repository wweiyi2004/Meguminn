import type { Config } from "../core/config.js";
import type { LLMProvider } from "./types.js";
import { OpenAICompatibleProvider } from "./openai-compatible.js";
import { AnthropicProvider } from "./anthropic.js";

export function createProvider(config: Config): LLMProvider {
  switch (config.provider) {
    case "openai-compatible":
      return new OpenAICompatibleProvider({
        apiKey: config.apiKey,
        baseUrl: config.baseUrl,
        model: config.model,
        maxTokens: config.maxTokens,
        temperature: config.temperature,
      });
    case "anthropic":
      return new AnthropicProvider();
    default:
      throw new Error(`Unknown provider: ${config.provider}`);
  }
}
