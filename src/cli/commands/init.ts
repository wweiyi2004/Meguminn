import { Command } from "commander";
import fs from "node:fs";
import path from "node:path";
import chalk from "chalk";

export const initCommand = new Command("init")
  .description("Initialize Meguminn in the current project")
  .action(() => {
    const cwd = process.cwd();
    const agentDir = path.join(cwd, ".meguminn");
    const sessionsDir = path.join(agentDir, "sessions");
    const checkpointsDir = path.join(agentDir, "checkpoints");
    const configPath = path.join(agentDir, "config.json");
    const envExamplePath = path.join(cwd, ".env.example");

    if (!fs.existsSync(agentDir)) {
      fs.mkdirSync(agentDir, { recursive: true });
    }
    if (!fs.existsSync(sessionsDir)) {
      fs.mkdirSync(sessionsDir, { recursive: true });
    }
    if (!fs.existsSync(checkpointsDir)) {
      fs.mkdirSync(checkpointsDir, { recursive: true });
    }

    if (!fs.existsSync(configPath)) {
      const defaultConfig = {
        permissions: {
          allowRead: true,
          confirmBeforeWrite: true,
          confirmBeforeCommand: false,
          denyDangerousCommands: true,
        },
      };
      fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), "utf-8");
    }

    if (!fs.existsSync(envExamplePath)) {
      const envExample = [
        "MEGUMINN_PROVIDER=openai-compatible",
        "MEGUMINN_MODEL=gpt-4o-mini",
        "MEGUMINN_BASE_URL=https://api.openai.com/v1",
        "MEGUMINN_API_KEY=your-api-key-here",
        "",
      ].join("\n");
      fs.writeFileSync(envExamplePath, envExample, "utf-8");
    }

    console.log(chalk.green("✓ 已初始化 Meguminn"));
    console.log(chalk.gray(`  配置目录: ${agentDir}`));
    console.log(chalk.gray(`  会话目录: ${sessionsDir}`));
    console.log(chalk.gray(`  检查点目录: ${checkpointsDir}`));
    console.log("");
    console.log(chalk.yellow("请复制 .env.example 为 .env 并填写 API Key"));
  });
