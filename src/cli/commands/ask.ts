import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { loadConfig } from "../../core/config.js";
import { createProvider } from "../../llm/provider.js";
import { systemMessage, userMessage } from "../../llm/messages.js";

const SYSTEM_PROMPT = `You are a helpful AI programming assistant running in a terminal.
You can answer questions about code, architecture, and development.
Be concise and helpful. If you don't know something, say so.`;

export const askCommand = new Command("ask")
  .description("Ask a single question")
  .argument("<question>", "The question to ask")
  .action(async (question: string) => {
    const cwd = process.cwd();

    let config;
    try {
      config = loadConfig(cwd);
    } catch {
      console.log(chalk.red("无法加载配置。请确保 .env 文件存在。"));
      console.log(chalk.gray("运行 `Meguminn init` 然后复制 .env.example 为 .env"));
      return;
    }

    if (!config.apiKey) {
      console.log(chalk.red("未设置 API Key。请在 .env 中设置 MEGUMINN_API_KEY。"));
      return;
    }

    const provider = createProvider(config);
    const spinner = ora("思考中...").start();

    try {
      const messages = [systemMessage(SYSTEM_PROMPT), userMessage(question)];
      const response = await provider.chat(messages);
      spinner.stop();
      console.log("");
      console.log(chalk.cyan("Assistant:"));
      console.log(response);
    } catch (err) {
      spinner.stop();
      console.log(chalk.red(`错误: ${err instanceof Error ? err.message : String(err)}`));
    }
  });
