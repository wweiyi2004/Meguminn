import { execSync } from "node:child_process";

function runGit(cwd: string, args: string): string {
  try {
    return execSync(`git ${args}`, { cwd, encoding: "utf-8", timeout: 10000 }).trim();
  } catch {
    return "";
  }
}

export function isGitRepo(cwd: string): boolean {
  return runGit(cwd, "rev-parse --is-inside-work-tree") === "true";
}

export function getCurrentBranch(cwd: string): string {
  return runGit(cwd, "branch --show-current");
}

export function getGitStatus(cwd: string): string {
  return runGit(cwd, "status --short");
}

export function getGitDiff(cwd: string): string {
  return runGit(cwd, "diff");
}

export function getGitDiffStaged(cwd: string): string {
  return runGit(cwd, "diff --staged");
}
