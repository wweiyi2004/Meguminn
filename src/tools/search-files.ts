import { z } from "zod/v4";
import fg from "fast-glob";
import type { Tool } from "./tool.js";
import { okResult } from "./result.js";
import { createIgnoreFilter } from "../workspace/ignore.js";
import { toRelativePath } from "../workspace/paths.js";

const InputSchema = z.object({
  pattern: z.string(),
  maxResults: z.number().int().positive().default(50),
});

export const searchFilesTool: Tool = {
  name: "search_files",
  description: "Search for files by name pattern (supports glob)",
  inputSchema: InputSchema,
  riskLevel: "safe",
  async execute(input, context) {
    const { cwd } = context;
    const pattern = input.pattern as string;
    const maxResults = input.maxResults as number;
    const isAllowed = createIgnoreFilter(cwd);

    const globPattern = pattern.includes("*") ? pattern : `**/*${pattern}*`;
    const files = await fg(globPattern, {
      dot: false,
      onlyFiles: true,
      cwd,
      absolute: true,
    });

    const filtered = files
      .filter((f) => isAllowed(toRelativePath(cwd, f)))
      .slice(0, maxResults)
      .map((f) => toRelativePath(cwd, f));

    const content = filtered.length > 0 ? filtered.join("\n") : "No files found matching the pattern.";
    return okResult(content, { count: filtered.length });
  },
};
