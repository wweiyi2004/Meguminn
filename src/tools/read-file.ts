import { z } from "zod/v4";
import fs from "node:fs";
import path from "node:path";
import type { Tool } from "./tool.js";
import { okResult, errorResult } from "./result.js";
import { safeResolve, assertNotSensitive } from "../utils/security.js";

const MAX_FILE_SIZE = 200 * 1024;

const BINARY_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".bmp", ".ico", ".webp",
  ".pdf", ".zip", ".tar", ".gz", ".rar", ".7z",
  ".exe", ".dll", ".so", ".dylib",
  ".woff", ".woff2", ".ttf", ".eot",
  ".mp3", ".mp4", ".avi", ".mov", ".wav",
]);

const InputSchema = z.object({
  path: z.string(),
  maxLines: z.number().int().positive().default(2000),
});

export const readFileTool: Tool = {
  name: "read_file",
  description: "Read the contents of a file with line numbers",
  inputSchema: InputSchema,
  riskLevel: "safe",
  async execute(input, context) {
    const { cwd } = context;
    const filePath = input.path as string;
    const maxLines = input.maxLines as number;

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

    const stat = fs.statSync(resolved);
    if (stat.isDirectory()) {
      return errorResult(`Path is a directory, not a file: ${filePath}`);
    }

    const ext = path.extname(resolved).toLowerCase();
    if (BINARY_EXTENSIONS.has(ext)) {
      return errorResult(`Cannot read binary file: ${filePath}`);
    }

    if (stat.size > MAX_FILE_SIZE) {
      const content = fs.readFileSync(resolved, "utf-8");
      const lines = content.split("\n").slice(0, maxLines);
      const truncated = lines.join("\n");
      return okResult(
        `[File truncated: ${stat.size} bytes, showing first ${maxLines} lines]\n\n${numberLines(truncated)}`,
        { truncated: true, totalSize: stat.size }
      );
    }

    const content = fs.readFileSync(resolved, "utf-8");
    const lines = content.split("\n");
    const displayLines = lines.slice(0, maxLines);
    const wasTruncated = lines.length > maxLines;

    let result = numberLines(displayLines.join("\n"));
    if (wasTruncated) {
      result += `\n\n[Truncated: showing ${maxLines} of ${lines.length} lines]`;
    }

    return okResult(result, { lines: lines.length, truncated: wasTruncated });
  },
};

function numberLines(text: string): string {
  return text
    .split("\n")
    .map((line, i) => `${String(i + 1).padStart(4)}: ${line}`)
    .join("\n");
}
