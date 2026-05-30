import { Command } from "commander";
import chalk from "chalk";
import boxen from "boxen";
import { loadConfig } from "../../core/config.js";
import { Agent } from "../../core/agent.js";

export const runCommand = new Command("run")
  .description("Run a task using the AI agent")
  .argument("<task>", "The task to perform")
  .option("--yes", "Auto-confirm safe operations", false)
  .action(async (task: string, opts: { yes: boolean }) => {
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
      boxen(chalk.bold("Meguminn run") + `\nModel: ${config.model}\nTask: ${task}`, {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "green",
      })
    );

    const agent = new Agent(config, cwd);
    await agent.runTask(task, opts.yes);
  });
