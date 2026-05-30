import { z } from "zod/v4";
import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";

const ConfigSchema = z.object({
  provider: z.enum(["openai-compatible", "anthropic"]).default("openai-compatible"),
  model: z.string().min(1).default("gpt-4o-mini"),
  baseUrl: z.string().url().default("https://api.openai.com/v1"),
  apiKey: z.string().default(""),
  maxTokens: z.number().int().positive().default(4096),
  temperature: z.number().min(0).max(2).default(0.7),
  maxLoopSteps: z.number().int().positive().default(20),
});

export type Config = z.infer<typeof ConfigSchema>;

const PermissionsSchema = z.object({
  allowRead: z.boolean().default(true),
  confirmBeforeWrite: z.boolean().default(true),
  confirmBeforeCommand: z.boolean().default(false),
  denyDangerousCommands: z.boolean().default(true),
});

const LocalConfigSchema = z
  .object({
    permissions: PermissionsSchema.default({
      allowRead: true,
      confirmBeforeWrite: true,
      confirmBeforeCommand: false,
      denyDangerousCommands: true,
    }),
  })
  .default({
    permissions: {
      allowRead: true,
      confirmBeforeWrite: true,
      confirmBeforeCommand: false,
      denyDangerousCommands: true,
    },
  });

export type LocalConfig = z.infer<typeof LocalConfigSchema>;

export function maskApiKey(key: string): string {
  if (key.length <= 8) {
    return "****";
  }
  return `${key.slice(0, 4)}****${key.slice(-4)}`;
}

export function loadConfig(cwd: string): Config {
  dotenv.config({ path: path.join(cwd, ".env") });

  const raw = {
    provider: process.env.MEGUMINN_PROVIDER ?? process.env.OPENAI_BASE_URL ? "openai-compatible" : "openai-compatible",
    model: process.env.MEGUMINN_MODEL ?? process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    baseUrl: process.env.MEGUMINN_BASE_URL ?? process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
    apiKey: process.env.MEGUMINN_API_KEY ?? process.env.OPENAI_API_KEY ?? "",
    maxTokens: Number(process.env.MEGUMINN_MAX_TOKENS) || 4096,
    temperature: Number(process.env.MEGUMINN_TEMPERATURE) || 0.7,
    maxLoopSteps: Number(process.env.MEGUMINN_MAX_LOOP_STEPS) || 20,
  };

  return ConfigSchema.parse(raw);
}

export function loadLocalConfig(cwd: string): LocalConfig {
  const configPath = path.join(cwd, ".meguminn", "config.json");

  if (!fs.existsSync(configPath)) {
    return LocalConfigSchema.parse({});
  }

  const raw = fs.readFileSync(configPath, "utf-8");
  const parsed = JSON.parse(raw);
  return LocalConfigSchema.parse(parsed);
}

export function getConfigSummary(config: Config): {
  provider: string;
  model: string;
  baseUrl: string;
  apiKeyStatus: string;
} {
  return {
    provider: config.provider,
    model: config.model,
    baseUrl: config.baseUrl,
    apiKeyStatus: config.apiKey ? maskApiKey(config.apiKey) : "(not set)",
  };
}
