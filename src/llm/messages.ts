import type { Message } from "./types.js";

export function systemMessage(content: string): Message {
  return { role: "system", content };
}

export function userMessage(content: string): Message {
  return { role: "user", content };
}

export function assistantMessage(content: string): Message {
  return { role: "assistant", content };
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function truncateMessages(messages: Message[], maxTokens: number): Message[] {
  const systemMsgs = messages.filter((m) => m.role === "system");
  const nonSystemMsgs = messages.filter((m) => m.role !== "system");

  let totalTokens = systemMsgs.reduce((sum, m) => sum + estimateTokens(m.content), 0);
  const result = [...systemMsgs];

  for (let i = nonSystemMsgs.length - 1; i >= 0; i--) {
    const tokens = estimateTokens(nonSystemMsgs[i].content);
    if (totalTokens + tokens > maxTokens) {
      break;
    }
    totalTokens += tokens;
    result.push(nonSystemMsgs[i]);
  }

  return [
    ...result.filter((m) => m.role === "system"),
    ...result.filter((m) => m.role !== "system").reverse(),
  ];
}
