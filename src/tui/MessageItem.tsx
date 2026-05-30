import { Box, Text } from "ink";
import type { TUIMessage } from "./types.js";

interface MessageItemProps {
  message: TUIMessage;
}

export function MessageItem({ message }: MessageItemProps) {
  switch (message.type) {
    case "user":
      return (
        <Box flexDirection="column" marginBottom={1}>
          <Text color="green" bold>
            You
          </Text>
          <Text>{message.content}</Text>
        </Box>
      );

    case "assistant":
      return (
        <Box flexDirection="column" marginBottom={1}>
          <Text color="cyan" bold>
            Assistant
          </Text>
          <Text wrap="wrap">{message.content}</Text>
        </Box>
      );

    case "thought":
      return (
        <Box flexDirection="column" marginBottom={1}>
          <Text color="gray" italic>
            💭 {message.content}
          </Text>
        </Box>
      );

    case "tool_call":
      return (
        <Box flexDirection="column" marginBottom={1} paddingLeft={2}>
          <Text color="yellow">
            🔧 <Text bold>{message.toolName}</Text>
            <Text dimColor>({formatToolInput(message.toolInput)})</Text>
          </Text>
        </Box>
      );

    case "tool_result":
      return (
        <Box flexDirection="column" marginBottom={1} paddingLeft={4}>
          <Text color={message.toolOk ? "green" : "red"}>
            {message.toolOk ? "✓" : "✗"}{" "}
            <Text dimColor>{truncate(message.content, 200)}</Text>
          </Text>
        </Box>
      );

    case "plan":
      return (
        <Box flexDirection="column" marginBottom={1}>
          <Text bold color="magenta">
            📋 任务计划
          </Text>
          {message.todos?.map((todo, i) => (
            <Box key={i}>
              <Text color={todo.status === "completed" ? "green" : todo.status === "in_progress" ? "yellow" : "gray"}>
                {"  "}
                {todo.status === "completed" ? "✓" : todo.status === "in_progress" ? "→" : "○"} {todo.content}
              </Text>
            </Box>
          ))}
        </Box>
      );

    case "error":
      return (
        <Box flexDirection="column" marginBottom={1}>
          <Text color="red" bold>
            ✗ Error
          </Text>
          <Text color="red">{message.content}</Text>
        </Box>
      );

    case "system":
      return (
        <Box flexDirection="column" marginBottom={1}>
          <Text dimColor>{message.content}</Text>
        </Box>
      );

    default:
      return null;
  }
}

function formatToolInput(input?: Record<string, unknown>): string {
  if (!input) return "";
  const entries = Object.entries(input);
  if (entries.length === 0) return "";
  return entries
    .slice(0, 3)
    .map(([k, v]) => {
      const val = typeof v === "string" ? (v.length > 30 ? v.slice(0, 30) + "..." : v) : String(v);
      return `${k}: ${val}`;
    })
    .join(", ");
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + "...";
}
