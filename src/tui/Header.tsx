import { Box, Text } from "ink";

interface HeaderProps {
  model: string;
  cwd: string;
  sessionId: string;
  step: number;
  maxSteps: number;
}

export function Header({ model, cwd, sessionId, step, maxSteps }: HeaderProps) {
  const projectName = cwd.split(/[/\\]/).pop() ?? cwd;

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={1}>
      <Box justifyContent="space-between">
        <Text bold color="cyan">
          Meguminn
        </Text>
        <Text dimColor>v0.1.0</Text>
      </Box>
      <Box>
        <Text dimColor>
          Model: <Text color="green">{model}</Text>
          {"  "}
          Project: <Text color="yellow">{projectName}</Text>
          {"  "}
          Session: <Text dimColor>{sessionId.slice(0, 8)}</Text>
        </Text>
      </Box>
      {step > 0 && (
        <Box>
          <Text dimColor>
            Step: <Text color="magenta">{step}/{maxSteps}</Text>
          </Text>
        </Box>
      )}
    </Box>
  );
}
