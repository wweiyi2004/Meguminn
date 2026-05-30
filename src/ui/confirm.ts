import readline from "node:readline";
import chalk from "chalk";

export async function confirm(message: string, autoConfirm = false): Promise<boolean> {
  if (autoConfirm) return true;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${chalk.yellow(message)} [y/N] `, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === "y");
    });
  });
}
