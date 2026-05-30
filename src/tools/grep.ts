import { z } from "zod/v4";
import fs from "node:fs";
import fg from "fast-glob";
import type { Tool } from "./tool.js";
import { okResult } from "./result.js";
import { createIgnoreFilter } from "../workspace/ignore.js";
import { toRelativePath } from "../workspace/paths.js";

const InputSchema = z.object({
  query: z.string(),
  include: z.string().default("**/*"),
  exclude: z.string().optional(),
  maxResults: z.number().int().positive().default(50),
});

interface GrepMatch {
  file: string;
  line: number;
  content: string;
}

export const grepTool: Tool = {
  name: "grep",
  description: "Search for text content in project files",
  inputSchema: InputSchema,
  riskLevel: "safe",
  async execute(input, context) {
    const { cwd } = context;
    const query = input.query as string;
    const include = input.include as string;
    const exclude = input.exclude as string | undefined;
    const maxResults = input.maxResults as number;
    const isAllowed = createIgnoreFilter(cwd);

    const files = await fg(include, {
      dot: false,
      onlyFiles: true,
      cwd,
      absolute: true,
      ignore: exclude ? [exclude] : undefined,
    });

    const matches: GrepMatch[] = [];
    const regex = new RegExp(escapeRegex(query), "i");

    for (const file of files) {
      if (matches.length >= maxResults) break;

      const rel = toRelativePath(cwd, file);
      if (!isAllowed(rel)) continue;

      try {
        const stat = fs.statSync(file);
        if (stat.size > 500 * 1024) continue;

        const content = fs.readFileSync(file, "utf-8");
        const lines = content.split("\n");

        for (let i = 0; i < lines.length; i++) {
          if (matches.length >= maxResults) break;
          if (regex.test(lines[i])) {
            matches.push({
              file: rel,
              line: i + 1,
              content: lines[i].trim().slice(0, 200),
            });
          }
        }
      } catch {
        // skip unreadable files
      }
    }

    if (matches.length === 0) {
      return okResult(`No matches found for "${query}"`);
    }

    const content = matches
      .map((m) => `${m.file}:${m.line}: ${m.content}`)
      .join("\n");

    return okResult(content, { matchCount: matches.length });
  },
};

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
