import { Command } from "commander";
import chalk from "chalk";
import crypto from "node:crypto";
import { loadConfig } from "../../core/config.js";
import { createProvider } from "../../llm/provider.js";
import { ToolRegistry } from "../../tools/registry.js";
import { getProjectInfoTool } from "../../tools/get-project-info.js";
import { listFilesTool } from "../../tools/list-files.js";
import { readFileTool } from "../../tools/read-file.js";
import { searchFilesTool } from "../../tools/search-files.js";
import { grepTool } from "../../tools/grep.js";
import { writeFileTool } from "../../tools/write-file.js";
import { editFileTool } from "../../tools/edit-file.js";
import { shellTool } from "../../tools/shell.js";
import { launchTUI } from "../../tui/index.js";

export const guiCommand = new Command("gui")
  .description("Launch the terminal GUI (TUI)")
  .option("--yes", "Auto-confirm safe operations", false)
  .action(async (opts: { yes: boolean }) => {
    const cwd = process.cwd();

    let config;
    try {
      config = loadConfig(cwd);
    } catch {
      console.log(chalk.red("无法加载配置。请确保 .env 文件存在。"));
      return;
    }

    if (!config.apiKey) {
      console.log(chalk.red("未设置 API Key。请在 .env 中设置 MEGUMINN_API_KEY。"));
      return;
    }

    const provider = createProvider(config);
    const registry = new ToolRegistry();
    registry.register(getProjectInfoTool);
    registry.register(listFilesTool);
    registry.register(readFileTool);
    registry.register(searchFilesTool);
    registry.register(grepTool);
    registry.register(writeFileTool);
    registry.register(editFileTool);
    registry.register(shellTool);

    const sessionId = crypto.randomUUID();

    launchTUI({
      provider,
      registry,
      toolContext: { cwd, sessionId, autoConfirm: opts.yes },
      model: config.model,
      cwd,
      sessionId,
      maxSteps: config.maxLoopSteps,
    });
  });
