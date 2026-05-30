#!/usr/bin/env node

import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { configCommand } from "./commands/config.js";
import { askCommand } from "./commands/ask.js";
import { chatCommand } from "./commands/chat.js";
import { runCommand } from "./commands/run.js";
import { editCommand } from "./commands/edit.js";
import { reviewCommand } from "./commands/review.js";

const program = new Command();

program
  .name("Meguminn")
  .description("AI Agent CLI - A terminal-based AI programming assistant")
  .version("0.1.0");

program.addCommand(initCommand);
program.addCommand(configCommand);
program.addCommand(askCommand);
program.addCommand(chatCommand);
program.addCommand(runCommand);
program.addCommand(editCommand);
program.addCommand(reviewCommand);

program.parse();
