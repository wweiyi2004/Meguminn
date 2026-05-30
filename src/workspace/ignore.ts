import fs from "node:fs";
import path from "node:path";
import ignore from "ignore";

const DEFAULT_IGNORES = [
  "node_modules",
  ".git",
  "dist",
  "build",
  "coverage",
  ".next",
  ".turbo",
  ".cache",
  ".meguminn",
  "*.log",
];

export function createIgnoreFilter(cwd: string): (relativePath: string) => boolean {
  const ig = ignore();
  ig.add(DEFAULT_IGNORES);

  const gitignorePath = path.join(cwd, ".gitignore");
  if (fs.existsSync(gitignorePath)) {
    const content = fs.readFileSync(gitignorePath, "utf-8");
    ig.add(content);
  }

  return (relativePath: string) => {
    const normalized = relativePath.replace(/\\/g, "/");
    return !ig.ignores(normalized);
  };
}
