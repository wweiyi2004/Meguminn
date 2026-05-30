import { render } from "ink";
import { App } from "./App.js";
import type { LLMProvider } from "../llm/types.js";
import type { ToolRegistry } from "../tools/registry.js";
import type { ToolContext } from "../tools/tool.js";

export interface LaunchTUIOptions {
  provider: LLMProvider;
  registry: ToolRegistry;
  toolContext: ToolContext;
  model: string;
  cwd: string;
  sessionId: string;
  maxSteps: number;
}

export function launchTUI(options: LaunchTUIOptions): void {
  render(
    <App
      provider={options.provider}
      registry={options.registry}
      toolContext={options.toolContext}
      model={options.model}
      cwd={options.cwd}
      sessionId={options.sessionId}
      maxSteps={options.maxSteps}
    />
  );
}
