import { z } from "zod/v4";
import fs from "node:fs";
import path from "node:path";
import type { Tool } from "./tool.js";
import { okResult, errorResult } from "./result.js";
import { safeResolve, assertNotSensitive } from "../utils/security.js";
import { createCheckpoint } from "../core/checkpoint.js";
import { generateDiff, colorizeDiff, truncateDiff } from "../workspace/diff.js";
import { confirm } from "../ui/confirm.js";

const InputSchema = z.object({
  path: z.string(),
  content: z.string(),
  reason: z.string().default("Agent write_file"),
});

export const writeFileTool: Tool = {
  name: "write_file",
  description: "Write content to a file (creates or overwrites)",
  inputSchema: InputSchema,
  riskLevel: "write",
  async execute(input, context) {
    const { cwd, sessionId, autoConfirm } = context;
    const filePath = input.path as string;
    const content = input.content as string;
    const reason = input.reason as string;

    let resolved: string;
    try {
      resolved = safeResolve(cwd, filePath);
      assertNotSensitive(resolved);
    } catch (err) {
      return errorResult(err instanceof Error ? err.message : String(err));
    }

    const exists = fs.existsSync(resolved);
    const oldContent = exists ? fs.readFileSync(resolved, "utf-8") : "";

    if (exists) {
      const diff = generateDiff(filePath, oldContent, content);
      const { display, truncated } = truncateDiff(diff);
      console.log(colorizeDiff(display));
      if (truncated) {
        console.log(`(diff truncated, full diff available at checkpoint)`);
      }
    } else {
      console.log(`Creating new file: ${filePath}`);
      const lines = content.split("\n").length;
      console.log(`(${lines} lines)`);
    }

    const confirmed = await confirm(`是否${exists ? "修改" : "创建"}文件 ${filePath}？`, autoConfirm);
    if (!confirmed) {
      return okResult("用户取消了写入操作。");
    }

    if (exists) {
      createCheckpoint(cwd, resolved, sessionId, reason);
    }

    const dir = path.dirname(resolved);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(resolved, content, "utf-8");
    return okResult(`文件${exists ? "已修改" : "已创建"}: ${filePath}`);
  },
};
