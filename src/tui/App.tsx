import React from "react";
import { Box, Text, useApp, useInput, Static } from "ink";
import Spinner from "ink-spinner";
import { Header } from "./Header.js";
import { MessageItem } from "./MessageItem.js";
import { InputBar } from "./InputBar.js";
import type { TUIMessage } from "./types.js";
import type { LLMProvider } from "../llm/types.js";
import { systemMessage, userMessage, assistantMessage } from "../llm/messages.js";
import type { ToolRegistry } from "../tools/registry.js";
import type { ToolContext } from "../tools/tool.js";

interface AppProps {
  provider: LLMProvider;
  registry: ToolRegistry;
  toolContext: ToolContext;
  model: string;
  cwd: string;
  sessionId: string;
  maxSteps: number;
}

const SYSTEM_PROMPT = `You are a helpful AI programming assistant running in a terminal TUI.
You can answer questions about code, architecture, and development.
Be concise and helpful. Use markdown formatting when appropriate.
If you don't know something, say so.`;

let msgIdCounter = 0;
function nextId(): string {
  return `msg-${++msgIdCounter}`;
}

export function App({ provider, registry, model, cwd, sessionId, maxSteps }: AppProps) {
  const { exit } = useApp();
  const [messages, setMessages] = React.useState<TUIMessage[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [loadingText, setLoadingText] = React.useState("");
  const [_step, _setStep] = React.useState(0);

  const chatHistoryRef = React.useRef<Array<{ role: "system" | "user" | "assistant"; content: string }>>([
    systemMessage(SYSTEM_PROMPT),
  ]);

  const addMessage = React.useCallback((msg: TUIMessage) => {
    setMessages((prev: TUIMessage[]) => [...prev, msg]);
  }, []);

  const handleExit = React.useCallback(() => {
    exit();
  }, [exit]);

  useInput((input, key) => {
    if (key.ctrl && input === "c") {
      handleExit();
    }
  });

  const handleSubmit = React.useCallback(
    async (input: string) => {
      if (isLoading) return;

      if (input === "/help") {
        addMessage({
          id: nextId(),
          type: "system",
          content: "命令: /help 帮助 | /clear 清空 | /model 模型 | /tools 工具 | exit 退出",
          timestamp: new Date(),
        });
        return;
      }

      if (input === "/clear") {
        setMessages([]);
        chatHistoryRef.current = [systemMessage(SYSTEM_PROMPT)];
        addMessage({ id: nextId(), type: "system", content: "会话已清空。", timestamp: new Date() });
        return;
      }

      if (input === "/model") {
        addMessage({ id: nextId(), type: "system", content: `当前模型: ${model}`, timestamp: new Date() });
        return;
      }

      if (input === "/tools") {
        const tools = registry.list().map((t) => `  ${t.name} - ${t.description}`).join("\n");
        addMessage({ id: nextId(), type: "system", content: `可用工具:\n${tools}`, timestamp: new Date() });
        return;
      }

      addMessage({ id: nextId(), type: "user", content: input, timestamp: new Date() });
      chatHistoryRef.current.push(userMessage(input));

      setIsLoading(true);
      setLoadingText("思考中");

      try {
        let fullResponse = "";
        for await (const chunk of provider.streamChat(chatHistoryRef.current)) {
          if (chunk.type === "text" && chunk.content) {
            fullResponse += chunk.content;
            setLoadingText(`生成中 (${fullResponse.length} chars)`);
          } else if (chunk.type === "error") {
            addMessage({ id: nextId(), type: "error", content: chunk.error ?? "Unknown error", timestamp: new Date() });
            setIsLoading(false);
            return;
          }
        }

        if (fullResponse) {
          chatHistoryRef.current.push(assistantMessage(fullResponse));
          addMessage({ id: nextId(), type: "assistant", content: fullResponse, timestamp: new Date() });
        }
      } catch (err) {
        addMessage({
          id: nextId(),
          type: "error",
          content: err instanceof Error ? err.message : String(err),
          timestamp: new Date(),
        });
      } finally {
        setIsLoading(false);
        setLoadingText("");
      }
    },
    [isLoading, provider, registry, model, addMessage]
  );

  const completedMessages = messages;

  return (
    <Box flexDirection="column" width={process.stdout.columns ?? 100} height={process.stdout.rows ?? 40}>
      <Header model={model} cwd={cwd} sessionId={sessionId} step={_step} maxSteps={maxSteps} />

      <Box flexDirection="column" flexGrow={1} paddingX={1} overflow="hidden">
        <Static items={completedMessages}>
          {(msg: TUIMessage) => (
            <Box key={msg.id}>
              <MessageItem message={msg} />
            </Box>
          )}
        </Static>

        {isLoading && (
          <Box paddingLeft={2}>
            <Text color="cyan">
              <Spinner type="dots" /> {loadingText}
            </Text>
          </Box>
        )}
      </Box>

      <InputBar onSubmit={handleSubmit} disabled={isLoading} onExit={handleExit} />
    </Box>
  );
}
