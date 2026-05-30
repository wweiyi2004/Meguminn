import { z } from "zod/v4";
import chalk from "chalk";
import type { LLMProvider } from "../llm/types.js";
import type { Message } from "../llm/types.js";
import { systemMessage, userMessage, assistantMessage } from "../llm/messages.js";
import type { ToolRegistry } from "../tools/registry.js";
import type { ToolContext } from "../tools/tool.js";
import { getCodingAgentSystemPrompt } from "../prompts/coding-agent.js";
import type { TodoItem } from "./session.js";

const ActionSchema = z.union([
  z.object({ type: z.literal("thought"), content: z.string() }),
  z.object({ type: z.literal("tool"), toolName: z.string(), input: z.record(z.string(), z.unknown()) }),
  z.object({ type: z.literal("plan"), todos: z.array(z.string()) }),
  z.object({ type: z.literal("final"), content: z.string() }),
]);

type AgentAction = z.infer<typeof ActionSchema>;

export interface AgentLoopOptions {
  maxSteps: number;
  autoConfirm: boolean;
}

export interface AgentLoopResult {
  success: boolean;
  summary: string;
  todos: TodoItem[];
  steps: number;
}

export class AgentLoop {
  private provider: LLMProvider;
  private registry: ToolRegistry;
  private toolContext: ToolContext;
  private options: AgentLoopOptions;
  private messages: Message[] = [];
  private todos: TodoItem[] = [];
  private steps = 0;

  constructor(
    provider: LLMProvider,
    registry: ToolRegistry,
    toolContext: ToolContext,
    options: AgentLoopOptions
  ) {
    this.provider = provider;
    this.registry = registry;
    this.toolContext = toolContext;
    this.options = options;

    const systemPrompt = getCodingAgentSystemPrompt(registry.getToolDescriptions());
    this.messages.push(systemMessage(systemPrompt));
  }

  async run(task: string): Promise<AgentLoopResult> {
    this.messages.push(userMessage(task));
    this.printStatus(`开始任务: ${task}`);

    while (this.steps < this.options.maxSteps) {
      this.steps++;
      this.printStatus(`步骤 ${this.steps}/${this.options.maxSteps}`);

      let response: string;
      try {
        response = await this.provider.chat(this.messages);
      } catch (err) {
        const errMsg = `LLM call failed: ${err instanceof Error ? err.message : String(err)}`;
        this.printError(errMsg);
        return { success: false, summary: errMsg, todos: this.todos, steps: this.steps };
      }

      this.messages.push(assistantMessage(response));

      const action = this.parseAction(response);
      if (!action) {
        this.messages.push(
          userMessage("Your response was not valid JSON. Please respond with a valid JSON action object only.")
        );
        continue;
      }

      const result = await this.handleAction(action);
      if (result !== null) {
        return result;
      }
    }

    return {
      success: false,
      summary: `达到最大步数限制 (${this.options.maxSteps})`,
      todos: this.todos,
      steps: this.steps,
    };
  }

  private parseAction(response: string): AgentAction | null {
    const trimmed = response.trim();

    let jsonStr = trimmed;
    const jsonMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    try {
      const parsed = JSON.parse(jsonStr);
      const result = ActionSchema.safeParse(parsed);
      if (result.success) {
        return result.data;
      }
      return null;
    } catch {
      return null;
    }
  }

  private async handleAction(action: AgentAction): Promise<AgentLoopResult | null> {
    switch (action.type) {
      case "thought":
        console.log(chalk.gray(`  💭 ${action.content}`));
        this.messages.push(userMessage("OK, proceed with your next action."));
        return null;

      case "plan":
        this.todos = action.todos.map((content, i) => ({
          id: String(i),
          content,
          status: "pending" as const,
        }));
        this.printPlan();
        this.messages.push(userMessage("Plan received. Start executing it."));
        return null;

      case "tool":
        return await this.handleToolCall(action.toolName, action.input);

      case "final":
        this.printSummary(action.content);
        return { success: true, summary: action.content, todos: this.todos, steps: this.steps };
    }
  }

  private async handleToolCall(
    toolName: string,
    input: Record<string, unknown>
  ): Promise<AgentLoopResult | null> {
    const tool = this.registry.get(toolName);
    if (!tool) {
      const errMsg = `Unknown tool: ${toolName}`;
      this.printError(errMsg);
      this.messages.push(userMessage(`Error: ${errMsg}. Available tools: ${this.registry.list().map((t) => t.name).join(", ")}`));
      return null;
    }

    this.printToolCall(toolName, input);

    if (this.todos.length > 0) {
      const pending = this.todos.find((t) => t.status === "pending");
      if (pending) {
        pending.status = "in_progress";
      }
    }

    const result = await this.registry.execute(toolName, input, this.toolContext);

    if (this.todos.length > 0) {
      const inProgress = this.todos.find((t) => t.status === "in_progress");
      if (inProgress) {
        inProgress.status = result.ok ? "completed" : "pending";
      }
    }

    const resultContent = result.ok
      ? `Tool ${toolName} result:\n${result.content}`
      : `Tool ${toolName} error:\n${result.error}`;

    const truncatedResult =
      resultContent.length > 10000
        ? resultContent.slice(0, 10000) + "\n... (output truncated)"
        : resultContent;

    this.messages.push(userMessage(truncatedResult));
    return null;
  }

  private printStatus(msg: string): void {
    console.log(chalk.blue(`> ${msg}`));
  }

  private printError(msg: string): void {
    console.log(chalk.red(`✗ ${msg}`));
  }

  private printToolCall(name: string, input: Record<string, unknown>): void {
    const inputStr = Object.entries(input)
      .map(([k, v]) => `${k}: ${typeof v === "string" && v.length > 50 ? v.slice(0, 50) + "..." : String(v)}`)
      .join(", ");
    console.log(chalk.cyan(`  🔧 ${name}(${inputStr})`));
  }

  private printPlan(): void {
    console.log(chalk.bold("\n任务计划:"));
    for (const todo of this.todos) {
      const icon = todo.status === "completed" ? "✓" : todo.status === "in_progress" ? "→" : " ";
      const color = todo.status === "completed" ? chalk.green : todo.status === "in_progress" ? chalk.yellow : chalk.gray;
      console.log(color(`  [${icon}] ${todo.content}`));
    }
    console.log("");
  }

  private printSummary(summary: string): void {
    console.log(chalk.bold.green("\n✓ 任务完成"));
    console.log(summary);
    if (this.todos.length > 0) {
      this.printPlan();
    }
  }
}
