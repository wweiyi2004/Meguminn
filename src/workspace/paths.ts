import path from "node:path";

export function getProjectRoot(cwd: string): string {
  return path.resolve(cwd);
}

export function toRelativePath(cwd: string, absolutePath: string): string {
  return path.relative(cwd, absolutePath);
}
