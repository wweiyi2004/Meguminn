import { z } from "zod/v4";
import fg from "fast-glob";
import path from "node:path";
import type { Tool } from "./tool.js";
import { okResult } from "./result.js";
import { createIgnoreFilter } from "../workspace/ignore.js";
import { toRelativePath } from "../workspace/paths.js";

const InputSchema = z.object({
  path: z.string().default("."),
  maxResults: z.number().int().positive().default(200),
});

export const listFilesTool: Tool = {
  name: "list_files",
  description: "List files in the project directory",
  inputSchema: InputSchema,
  riskLevel: "safe",
  async execute(input, context) {
    const { cwd } = context;
    const targetPath = path.resolve(cwd, input.path as string);
    const maxResults = input.maxResults as number;
    const isAllowed = createIgnoreFilter(cwd);

    const pattern = path.join(targetPath, "**/*").replace(/\\/g, "/");
    const files = await fg(pattern, {
      dot: false,
      onlyFiles: true,
      cwd,
      absolute: true,
    });

    const filtered = files
      .filter((f) => {
        const rel = toRelativePath(cwd, f);
        return isAllowed(rel);
      })
      .slice(0, maxResults)
      .map((f) => toRelativePath(cwd, f));

    const truncated = files.length > maxResults;
    let content = filtered.join("\n");
    if (truncated) {
      content += `\n\n(showing ${maxResults} of ${files.length} files)`;
    }

    return okResult(content, { count: filtered.length, truncated });
  },
};
