import { Command } from "commander";
import chalk from "chalk";
import readline from "node:readline";
import boxen from "boxen";
import { loadConfig } from "../../core/config.js";
import { createProvider } from "../../llm/provider.js";
import { systemMessage, userMessage, assistantMessage } from "../../llm/messages.js";
import { SessionManager } from "../../core/session.js";
import type { Message } from "../../llm/types.js";

const CHAT_SYSTEM_PROMPT = `You are a helpful AI programming assistant running in a terminal.
You are in interactive chat mode. The user may ask about their current project.
Be concise and helpful. Use markdown formatting when appropriate.
If you don't know something, say so. Do not make up information.`;

export const chatCommand = new Command("chat")
  .description("Start interactive chat mode")
  .action(async () => {
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
    const sessionManager = new SessionManager(cwd);
    const session = sessionManager.create(cwd);

    const messages: Message[] = [systemMessage(CHAT_SYSTEM_PROMPT)];

    console.log(
      boxen(chalk.bold("Meguminn chat") + `\nModel: ${config.model}\nSession: ${session.sessionId.slice(0, 8)}`, {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "cyan",
      })
    );

    console.log(chalk.gray('输入消息开始对话。输入 exit/quit 退出，/help 查看命令。'));
    console.log("");

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const prompt = (): Promise<string> =>
      new Promise((resolve) => {
        rl.question(chalk.green("You> "), resolve);
      });

    while (true) {
      const input = (await prompt()).trim();
      if (!input) continue;

      if (input === "exit" || input === "quit") {
        console.log(chalk.gray("再见！"));
        rl.close();
        return;
      }

      if (input === "/help") {
        console.log(chalk.cyan("可用命令:"));
        console.log("  /help     显示帮助");
        console.log("  /clear    清空会话");
        console.log("  /model    查看当前模型");
        console.log("  /session  查看会话信息");
        console.log("  exit      退出");
        continue;
      }

      if (input === "/clear") {
        messages.length = 1;
        sessionManager.clear(session);
        console.log(chalk.yellow("会话已清空。"));
        continue;
      }

      if (input === "/model") {
        console.log(chalk.cyan(`当前模型: ${config.model}`));
        continue;
      }

      if (input === "/session") {
        console.log(chalk.cyan(`Session ID: ${session.sessionId}`));
        console.log(chalk.cyan(`消息数: ${messages.length - 1}`));
        console.log(chalk.cyan(`创建时间: ${session.createdAt}`));
        continue;
      }

      messages.push(userMessage(input));
      sessionManager.addMessage(session, userMessage(input));

      process.stdout.write(chalk.cyan("\nAssistant> "));

      try {
        let fullResponse = "";
        for await (const chunk of provider.streamChat(messages)) {
          if (chunk.type === "text" && chunk.content) {
            process.stdout.write(chunk.content);
            fullResponse += chunk.content;
          } else if (chunk.type === "error") {
            console.log(chalk.red(`\n错误: ${chunk.error}`));
            messages.pop();
            break;
          }
        }
        console.log("");

        if (fullResponse) {
          messages.push(assistantMessage(fullResponse));
          sessionManager.addMessage(session, assistantMessage(fullResponse));
        }
      } catch (err) {
        console.log(chalk.red(`\n错误: ${err instanceof Error ? err.message : String(err)}`));
        messages.pop();
      }
    }
  });
