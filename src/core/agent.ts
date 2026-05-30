import type { Config } from "./config.js";
import type { LLMProvider } from "../llm/types.js";
import { createProvider } from "../llm/provider.js";
import { ToolRegistry } from "../tools/registry.js";
import { getProjectInfoTool } from "../tools/get-project-info.js";
import { listFilesTool } from "../tools/list-files.js";
import { readFileTool } from "../tools/read-file.js";
import { searchFilesTool } from "../tools/search-files.js";
import { grepTool } from "../tools/grep.js";
import { writeFileTool } from "../tools/write-file.js";
import { editFileTool } from "../tools/edit-file.js";
import { shellTool } from "../tools/shell.js";
import { AgentLoop } from "./agent-loop.js";
import type { AgentLoopResult } from "./agent-loop.js";

export class Agent {
  private config: Config;
  private provider: LLMProvider;
  private registry: ToolRegistry;
  private cwd: string;

  constructor(config: Config, cwd: string) {
    this.config = config;
    this.cwd = cwd;
    this.provider = createProvider(config);
    this.registry = new ToolRegistry();
    this.registerTools();
  }

  private registerTools(): void {
    this.registry.register(getProjectInfoTool);
    this.registry.register(listFilesTool);
    this.registry.register(readFileTool);
    this.registry.register(searchFilesTool);
    this.registry.register(grepTool);
    this.registry.register(writeFileTool);
    this.registry.register(editFileTool);
    this.registry.register(shellTool);
  }

  getProvider(): LLMProvider {
    return this.provider;
  }

  getRegistry(): ToolRegistry {
    return this.registry;
  }

  async runTask(task: string, autoConfirm = false): Promise<AgentLoopResult> {
    const loop = new AgentLoop(this.provider, this.registry, {
      cwd: this.cwd,
      sessionId: "agent",
      autoConfirm,
    }, {
      maxSteps: this.config.maxLoopSteps,
      autoConfirm,
    });

    return loop.run(task);
  }
}
