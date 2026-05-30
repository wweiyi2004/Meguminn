import { createTwoFilesPatch } from "diff";
import chalk from "chalk";

export function generateDiff(filePath: string, oldContent: string, newContent: string): string {
  return createTwoFilesPatch(filePath, filePath, oldContent, newContent, "before", "after");
}

export function colorizeDiff(diffText: string): string {
  return diffText
    .split("\n")
    .map((line) => {
      if (line.startsWith("+") && !line.startsWith("+++")) {
        return chalk.green(line);
      }
      if (line.startsWith("-") && !line.startsWith("---")) {
        return chalk.red(line);
      }
      if (line.startsWith("@@")) {
        return chalk.cyan(line);
      }
      return line;
    })
    .join("\n");
}

const MAX_DIFF_LINES = 100;

export function truncateDiff(diffText: string): { display: string; truncated: boolean } {
  const lines = diffText.split("\n");
  if (lines.length <= MAX_DIFF_LINES) {
    return { display: diffText, truncated: false };
  }
  return {
    display: lines.slice(0, MAX_DIFF_LINES).join("\n") + `\n\n... (${lines.length - MAX_DIFF_LINES} more lines)`,
    truncated: true,
  };
}
