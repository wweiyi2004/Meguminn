import { z } from "zod/v4";
import fs from "node:fs";
import path from "node:path";
import type { Tool } from "./tool.js";
import { okResult } from "./result.js";
import { isGitRepo, getCurrentBranch, getGitStatus } from "../workspace/git.js";

const InputSchema = z.object({});

export const getProjectInfoTool: Tool = {
  name: "get_project_info",
  description: "Get basic information about the current project",
  inputSchema: InputSchema,
  riskLevel: "safe",
  async execute(_input, context) {
    const { cwd } = context;
    const info: string[] = [];

    info.push(`Project directory: ${path.basename(cwd)}`);
    info.push(`Full path: ${cwd}`);

    const pkgPath = path.join(cwd, "package.json");
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8")) as {
          name?: string;
          version?: string;
          description?: string;
          scripts?: Record<string, string>;
          dependencies?: Record<string, string>;
        };
        info.push(`\nPackage: ${pkg.name ?? "unknown"} v${pkg.version ?? "0.0.0"}`);
        if (pkg.description) info.push(`Description: ${pkg.description}`);
        if (pkg.scripts) {
          info.push(`Scripts: ${Object.keys(pkg.scripts).join(", ")}`);
        }
        if (pkg.dependencies) {
          const deps = Object.keys(pkg.dependencies).slice(0, 20);
          info.push(`Dependencies: ${deps.join(", ")}${Object.keys(pkg.dependencies).length > 20 ? "..." : ""}`);
        }
      } catch {
        info.push("package.json: (could not parse)");
      }
    }

    const tsconfigPath = path.join(cwd, "tsconfig.json");
    if (fs.existsSync(tsconfigPath)) {
      info.push("TypeScript: yes (tsconfig.json found)");
    }

    const readmePath = path.join(cwd, "README.md");
    if (fs.existsSync(readmePath)) {
      info.push("README: yes");
    }

    if (isGitRepo(cwd)) {
      info.push(`\nGit branch: ${getCurrentBranch(cwd)}`);
      const status = getGitStatus(cwd);
      if (status) {
        info.push(`Git status:\n${status}`);
      } else {
        info.push("Git status: clean");
      }
    } else {
      info.push("\nGit: not a git repository");
    }

    const entries = fs.readdirSync(cwd, { withFileTypes: true });
    const dirs = entries.filter((e) => e.isDirectory() && !e.name.startsWith(".")).map((e) => e.name);
    const files = entries.filter((e) => e.isFile()).map((e) => e.name);
    info.push(`\nTop-level directories: ${dirs.join(", ") || "(none)"}`);
    info.push(`Top-level files: ${files.join(", ") || "(none)"}`);

    return okResult(info.join("\n"));
  },
};
