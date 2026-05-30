import type { Tool, ToolContext } from "./tool.js";
import type { ToolResult } from "./result.js";
import { errorResult } from "./result.js";

export class ToolRegistry {
  private tools = new Map<string, Tool>();

  register(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  list(): Tool[] {
    return Array.from(this.tools.values());
  }

  async execute(name: string, input: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      return errorResult(`Unknown tool: ${name}`);
    }

    const parsed = tool.inputSchema.safeParse(input);
    if (!parsed.success) {
      return errorResult(`Invalid input for tool ${name}: ${JSON.stringify(parsed.error.issues)}`);
    }

    try {
      return await tool.execute(parsed.data as Record<string, unknown>, context);
    } catch (err) {
      return errorResult(`Tool ${name} failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  getToolDescriptions(): string {
    return this.list()
      .map((t) => `- ${t.name}: ${t.description} (risk: ${t.riskLevel})`)
      .join("\n");
  }
}
