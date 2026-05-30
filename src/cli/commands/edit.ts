import { Command } from "commander";
import chalk from "chalk";
import boxen from "boxen";
import { loadConfig } from "../../core/config.js";
import { Agent } from "../../core/agent.js";

export const editCommand = new Command("edit")
  .description("Edit files using the AI agent")
  .argument("<request>", "The edit request")
  .option("--yes", "Auto-confirm safe operations", false)
  .action(async (request: string, opts: { yes: boolean }) => {
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

    console.log(
      boxen(chalk.bold("Meguminn edit") + `\nModel: ${config.model}\nRequest: ${request}`, {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "yellow",
      })
    );

    const task = `You are in edit mode. The user wants to: ${request}\n\nFirst understand the relevant files, then make the edits. Always show diffs before writing.`;
    const agent = new Agent(config, cwd);
    await agent.runTask(task, opts.yes);
  });
