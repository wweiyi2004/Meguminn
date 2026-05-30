import { describe, it, expect } from "vitest";
import { maskApiKey } from "../../src/core/config.js";

describe("maskApiKey", () => {
  it("masks API key showing first 4 and last 4 characters", () => {
    expect(maskApiKey("sk-1a2b3c4d5e6f7g8h9z8y")).toBe("sk-1****9z8y");
  });

  it("handles short keys", () => {
    expect(maskApiKey("short")).toBe("****");
    expect(maskApiKey("12345678")).toBe("****");
  });

  it("handles typical API keys", () => {
    expect(maskApiKey("sk-proj-abcdefghijklmnopqrstuvwxyz123456")).toBe("sk-p****3456");
  });
});
