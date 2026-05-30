import { z } from "zod/v4";
import { execa } from "execa";
import type { Tool } from "./tool.js";
import { okResult, errorResult } from "./result.js";
import { classifyCommandRisk } from "../utils/security.js";
import { confirm } from "../ui/confirm.js";
import chalk from "chalk";

const InputSchema = z.object({
  command: z.string(),
  timeout: z.number().int().positive().default(30000),
});

const MAX_OUTPUT = 50000;

export const shellTool: Tool = {
  name: "shell",
  description: "Execute a shell command in the project directory",
  inputSchema: InputSchema,
  riskLevel: "command",
  async execute(input, context) {
    const { cwd, autoConfirm } = context;
    const command = input.command as string;
    const timeout = input.timeout as number;

    const risk = classifyCommandRisk(command);

    if (risk === "dangerous") {
      return errorResult(`Command blocked (dangerous): ${command}`);
    }

    if (risk === "medium") {
      console.log(chalk.yellow(`即将执行中风险命令: ${command}`));
      const confirmed = await confirm("该命令可能有风险，是否继续？", autoConfirm);
      if (!confirmed) {
        return okResult("用户取消了命令执行。");
      }
    }

    try {
      const isWindows = process.platform === "win32";
      const result = await execa(isWindows ? "cmd" : "sh", isWindows ? ["/c", command] : ["-c", command], {
        cwd,
        timeout,
        reject: false,
        env: { ...process.env },
      });

      let stdout = result.stdout ?? "";
      let stderr = result.stderr ?? "";

      if (stdout.length > MAX_OUTPUT) {
        stdout = stdout.slice(0, MAX_OUTPUT) + "\n... (output truncated)";
      }
      if (stderr.length > MAX_OUTPUT) {
        stderr = stderr.slice(0, MAX_OUTPUT) + "\n... (output truncated)";
      }

      const parts: string[] = [];
      if (stdout) parts.push(`stdout:\n${stdout}`);
      if (stderr) parts.push(`stderr:\n${stderr}`);
      parts.push(`exit code: ${result.exitCode}`);

      const content = parts.join("\n\n");
      return result.exitCode === 0 ? okResult(content) : errorResult(content);
    } catch (err) {
      if (err instanceof Error && err.message.includes("timed out")) {
        return errorResult(`Command timed out after ${timeout}ms: ${command}`);
      }
      return errorResult(`Command failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  },
};
