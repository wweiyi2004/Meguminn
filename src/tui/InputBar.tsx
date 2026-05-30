import React from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";

interface InputBarProps {
  onSubmit: (value: string) => void;
  disabled: boolean;
  onExit: () => void;
}

export function InputBar({ onSubmit, disabled, onExit }: InputBarProps) {
  const [value, setValue] = React.useState("");

  useInput((input, key) => {
    if (key.ctrl && input === "c") {
      onExit();
    }
  });

  const handleSubmit = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return;

    if (trimmed === "exit" || trimmed === "quit" || trimmed === "/exit" || trimmed === "/quit") {
      onExit();
      return;
    }

    onSubmit(trimmed);
    setValue("");
  };

  return (
    <Box flexDirection="column" borderStyle="single" borderColor="gray" paddingTop={1}>
      <Box>
        <Text dimColor>
          {disabled ? "⏳ 思考中..." : "输入消息 (exit 退出, /help 帮助)"}
        </Text>
      </Box>
      {!disabled && (
        <Box>
          <Text color="green" bold>
            {">"}{" "}
          </Text>
          <TextInput
            value={value}
            onChange={setValue}
            onSubmit={handleSubmit}
            placeholder="输入你的问题..."
          />
        </Box>
      )}
    </Box>
  );
}
