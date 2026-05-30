export class AgentError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = "AgentError";
  }
}

export class ConfigError extends AgentError {
  constructor(message: string) {
    super(message, "CONFIG_ERROR");
    this.name = "ConfigError";
  }
}

export class PermissionError extends AgentError {
  constructor(message: string) {
    super(message, "PERMISSION_ERROR");
    this.name = "PermissionError";
  }
}

export class ToolError extends AgentError {
  constructor(message: string) {
    super(message, "TOOL_ERROR");
    this.name = "ToolError";
  }
}

export class SecurityError extends AgentError {
  constructor(message: string) {
    super(message, "SECURITY_ERROR");
    this.name = "SecurityError";
  }
}
