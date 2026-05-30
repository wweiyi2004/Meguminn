import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { loadConfig } from "../../core/config.js";
import { createProvider } from "../../llm/provider.js";
import { systemMessage, userMessage } from "../../llm/messages.js";
import { getReviewAgentSystemPrompt } from "../../prompts/coding-agent.js";
import { isGitRepo, getGitDiff, getGitDiffStaged } from "../../workspace/git.js";

export const reviewCommand = new Command("review")
  .description("Review code changes using AI")
  .option("--staged", "Review staged changes only", false)
  .action(async (opts: { staged: boolean }) => {
    const cwd = process.cwd();

    if (!isGitRepo(cwd)) {
      console.log(chalk.red("当前目录不是一个 git 仓库。"));
      return;
    }

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

    const diff = opts.staged ? getGitDiffStaged(cwd) : getGitDiff(cwd);

    if (!diff) {
      console.log(chalk.yellow("没有可审查的改动。"));
      return;
    }

    console.log(chalk.bold(`\n审查${opts.staged ? "暂存区" : "工作区"}改动...\n`));

    const provider = createProvider(config);
    const spinner = ora("分析改动中...").start();

    try {
      const messages = [
        systemMessage(getReviewAgentSystemPrompt()),
        userMessage(`Please review the following git diff:\n\n\`\`\`diff\n${diff}\n\`\`\``),
      ];

      const response = await provider.chat(messages);
      spinner.stop();
      console.log(response);
    } catch (err) {
      spinner.stop();
      console.log(chalk.red(`错误: ${err instanceof Error ? err.message : String(err)}`));
    }
  });
