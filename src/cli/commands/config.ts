import { Command } from "commander";
import chalk from "chalk";
import { loadConfig, getConfigSummary } from "../../core/config.js";

export const configCommand = new Command("config")
  .description("Show current configuration")
  .action(() => {
    const cwd = process.cwd();

    try {
      const config = loadConfig(cwd);
      const summary = getConfigSummary(config);

      console.log(chalk.bold("Meguminn 配置"));
      console.log("");
      console.log(`  Provider:  ${chalk.cyan(summary.provider)}`);
      console.log(`  Model:     ${chalk.cyan(summary.model)}`);
      console.log(`  Base URL:  ${chalk.cyan(summary.baseUrl)}`);
      console.log(`  API Key:   ${chalk.cyan(summary.apiKeyStatus)}`);
      console.log(`  Max Tokens: ${chalk.cyan(String(config.maxTokens))}`);
      console.log(`  Temperature: ${chalk.cyan(String(config.temperature))}`);
    } catch {
      console.log(chalk.red("无法加载配置。请确保 .env 文件存在且格式正确。"));
      console.log(chalk.gray("运行 `Meguminn init` 初始化项目，然后复制 .env.example 为 .env。"));
    }
  });
