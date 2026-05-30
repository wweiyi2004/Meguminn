import path from "node:path";
import { SecurityError } from "./errors.js";

export function safeResolve(cwd: string, userPath: string): string {
  const resolved = path.resolve(cwd, userPath);
  const normalizedCwd = path.resolve(cwd);

  const cwdWithSep = normalizedCwd.endsWith(path.sep) ? normalizedCwd : normalizedCwd + path.sep;

  if (resolved !== normalizedCwd && !resolved.startsWith(cwdWithSep)) {
    throw new SecurityError(`Path escapes project directory: ${userPath}`);
  }

  return resolved;
}

const SENSITIVE_FILE_PATTERNS = [
  /^\.env$/,
  /^\.env\.local$/,
  /^\.env\.production$/,
  /^\.env\.development$/,
  /^\.env\.staging$/,
  /^id_rsa$/,
  /^id_rsa\.pub$/,
  /^id_ed25519$/,
  /^id_ed25519\.pub$/,
  /\.pem$/,
  /\.key$/,
  /^secrets\./,
  /^credentials\./,
];

export function isSensitiveFile(filePath: string): boolean {
  const basename = path.basename(filePath);
  return SENSITIVE_FILE_PATTERNS.some((pattern) => pattern.test(basename));
}

export function assertNotSensitive(filePath: string): void {
  if (isSensitiveFile(filePath)) {
    throw new SecurityError(`Access to sensitive file is not allowed: ${path.basename(filePath)}`);
  }
}

const DANGEROUS_COMMAND_PATTERNS = [
  /rm\s+-rf\s+\//,
  /rm\s+-rf\s+\*/,
  /rm\s+-rf\s+~/,
  /del\s+\/[sS]/,
  /rd\s+\/[sS]/,
  /\bformat\b/,
  /\bmkfs\b/,
  /\bdd\s+if=/,
  /sudo\s+rm/,
  /chmod\s+-R\s+777\s+\//,
  /chown\s+-R/,
  /Remove-Item\s+.*-Recurse.*\s+\\/,
  /Remove-Item\s+.*-Recurse.*\s+C:/,
  /rd\s+\/s\s+\\/,
  /:\(\)\s*\{\s*:\|:\s*&\s*\}\s*;/,
];

const MEDIUM_RISK_COMMAND_PATTERNS = [
  /\brm\b/,
  /\bdel\b/,
  /\bmv\b.*\s+\/(?:usr|etc|var|home)/,
  /git\s+reset\s+--hard/,
  /git\s+clean\s+-fd/,
  /npm\s+publish/,
  /pnpm\s+publish/,
  /git\s+push\s+--force/,
  /curl\s+.*\|\s*sh/,
  /wget\s+.*\|\s*sh/,
  /curl\s+.*\|\s*bash/,
  /wget\s+.*\|\s*bash/,
];

export type CommandRisk = "safe" | "medium" | "dangerous";

export function classifyCommandRisk(command: string): CommandRisk {
  for (const pattern of DANGEROUS_COMMAND_PATTERNS) {
    if (pattern.test(command)) return "dangerous";
  }
  for (const pattern of MEDIUM_RISK_COMMAND_PATTERNS) {
    if (pattern.test(command)) return "medium";
  }
  return "safe";
}
