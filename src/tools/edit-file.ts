import { z } from "zod/v4";
import fs from "node:fs";
import type { Tool } from "./tool.js";
import { okResult, errorResult } from "./result.js";
import { safeResolve, assertNotSensitive } from "../utils/security.js";
import { createCheckpoint } from "../core/checkpoint.js";
import { generateDiff, colorizeDiff, truncateDiff } from "../workspace/diff.js";
import { confirm } from "../ui/confirm.js";

const InputSchema = z.object({
  path: z.string(),
  oldText: z.string(),
  newText: z.string(),
  reason: z.string().default("Agent edit_file"),
});

export const editFileTool: Tool = {
  name: "edit_file",
  description: "Edit a file by replacing a specific text block. oldText must match exactly once.",
  inputSchema: InputSchema,
  riskLevel: "write",
  async execute(input, context) {
    const { cwd, sessionId, autoConfirm } = context;
    const filePath = input.path as string;
    const oldText = input.oldText as string;
    const newText = input.newText as string;
    const reason = input.reason as string;

    let resolved: string;
    try {
      resolved = safeResolve(cwd, filePath);
      assertNotSensitive(resolved);
    } catch (err) {
      return errorResult(err instanceof Error ? err.message : String(err));
    }

    if (!fs.existsSync(resolved)) {
      return errorResult(`File not found: ${filePath}`);
    }

    const content = fs.readFileSync(resolved, "utf-8");
    const occurrences = countOccurrences(content, oldText);

    if (occurrences === 0) {
      return errorResult(`oldText not found in ${filePath}`);
    }

    if (occurrences > 1) {
      return errorResult(`oldText found ${occurrences} times in ${filePath}. It must be unique. Please provide more context.`);
    }

    const newContent = content.replace(oldText, newText);
    const diff = generateDiff(filePath, content, newContent);
    const { display, truncated } = truncateDiff(diff);
    console.log(colorizeDiff(display));
    if (truncated) {
      console.log(`(diff truncated)`);
    }

    const confirmed = await confirm(`是否应用修改到 ${filePath}？`, autoConfirm);
    if (!confirmed) {
      return okResult("用户取消了编辑操作。");
    }

    createCheckpoint(cwd, resolved, sessionId, reason);
    fs.writeFileSync(resolved, newContent, "utf-8");
    return okResult(`文件已修改: ${filePath}`);
  },
};

function countOccurrences(text: string, search: string): number {
  let count = 0;
  let pos = 0;
  while (true) {
    const idx = text.indexOf(search, pos);
    if (idx === -1) break;
    count++;
    pos = idx + search.length;
  }
  return count;
}
