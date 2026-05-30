import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { shellTool } from "../../src/tools/shell.js";
import { editFileTool } from "../../src/tools/edit-file.js";
import type { ToolContext } from "../../src/tools/tool.js";

let tmpDir: string;
let context: ToolContext;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "my-agent-test-"));
  context = { cwd: tmpDir, sessionId: "test", autoConfirm: true };
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("shell", () => {
  it("blocks dangerous commands", async () => {
    const result = await shellTool.execute({ command: "rm -rf /" }, context);
    expect(result.ok).toBe(false);
    expect(result.error).toContain("dangerous");
  });

  it("blocks rm -rf *", async () => {
    const result = await shellTool.execute({ command: "rm -rf *" }, context);
    expect(result.ok).toBe(false);
    expect(result.error).toContain("dangerous");
  });

  it("executes safe commands", async () => {
    const isWindows = process.platform === "win32";
    const cmd = isWindows ? "echo hello" : "echo hello";
    const result = await shellTool.execute({ command: cmd }, context);
    expect(result.ok).toBe(true);
    expect(result.content).toContain("hello");
  });
});

describe("edit_file", () => {
  it("errors when oldText is not unique", async () => {
    const filePath = path.join(tmpDir, "test.txt");
    fs.writeFileSync(filePath, "aaa\nbbb\naaa\nccc");

    const result = await editFileTool.execute(
      { path: "test.txt", oldText: "aaa", newText: "xxx" },
      context
    );
    expect(result.ok).toBe(false);
    expect(result.error).toContain("2 times");
  });

  it("errors when oldText is not found", async () => {
    const filePath = path.join(tmpDir, "test.txt");
    fs.writeFileSync(filePath, "hello world");

    const result = await editFileTool.execute(
      { path: "test.txt", oldText: "notfound", newText: "xxx" },
      context
    );
    expect(result.ok).toBe(false);
    expect(result.error).toContain("not found");
  });

  it("edits file successfully when oldText is unique", async () => {
    const filePath = path.join(tmpDir, "test.txt");
    fs.writeFileSync(filePath, "hello world\nfoo bar");
    fs.mkdirSync(path.join(tmpDir, ".my-agent", "checkpoints"), { recursive: true });

    const result = await editFileTool.execute(
      { path: "test.txt", oldText: "hello world", newText: "hi world" },
      context
    );
    expect(result.ok).toBe(true);
    expect(fs.readFileSync(filePath, "utf-8")).toContain("hi world");
  });
});
