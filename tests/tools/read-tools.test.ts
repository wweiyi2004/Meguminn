import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { readFileTool } from "../../src/tools/read-file.js";
import { listFilesTool } from "../../src/tools/list-files.js";
import { grepTool } from "../../src/tools/grep.js";
import type { ToolContext } from "../../src/tools/tool.js";

let tmpDir: string;
let context: ToolContext;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "my-agent-test-"));
  context = { cwd: tmpDir, sessionId: "test", autoConfirm: false };

  fs.writeFileSync(path.join(tmpDir, "hello.txt"), "Hello World\nLine 2\nLine 3");
  fs.writeFileSync(path.join(tmpDir, "app.ts"), 'import { foo } from "./foo";\nconsole.log("hello");');
  fs.mkdirSync(path.join(tmpDir, "src"));
  fs.writeFileSync(path.join(tmpDir, "src", "index.ts"), "export const x = 1;");
  fs.mkdirSync(path.join(tmpDir, "node_modules", "pkg"), { recursive: true });
  fs.writeFileSync(path.join(tmpDir, "node_modules", "pkg", "index.js"), "module.exports = {}");
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("read_file", () => {
  it("reads a file with line numbers", async () => {
    const result = await readFileTool.execute({ path: "hello.txt" }, context);
    expect(result.ok).toBe(true);
    expect(result.content).toContain("1: Hello World");
    expect(result.content).toContain("2: Line 2");
  });

  it("rejects paths outside project", async () => {
    const result = await readFileTool.execute({ path: "../secret.txt" }, context);
    expect(result.ok).toBe(false);
    expect(result.error).toContain("escapes");
  });

  it("rejects sensitive files", async () => {
    fs.writeFileSync(path.join(tmpDir, ".env"), "SECRET=123");
    const result = await readFileTool.execute({ path: ".env" }, context);
    expect(result.ok).toBe(false);
    expect(result.error).toContain("sensitive");
  });

  it("returns error for non-existent file", async () => {
    const result = await readFileTool.execute({ path: "nonexistent.txt" }, context);
    expect(result.ok).toBe(false);
    expect(result.error).toContain("not found");
  });
});

describe("list_files", () => {
  it("lists project files", async () => {
    const result = await listFilesTool.execute({ path: ".", maxResults: 100 }, context);
    expect(result.ok).toBe(true);
    expect(result.content).toContain("hello.txt");
    expect(result.content).toContain(path.join("src", "index.ts"));
  });

  it("ignores node_modules", async () => {
    const result = await listFilesTool.execute({ path: ".", maxResults: 100 }, context);
    expect(result.ok).toBe(true);
    expect(result.content).not.toContain("node_modules");
  });
});

describe("grep", () => {
  it("finds matching content", async () => {
    const result = await grepTool.execute({ query: "Hello World", include: "**/*" }, context);
    expect(result.ok).toBe(true);
    expect(result.content).toContain("hello.txt");
    expect(result.content).toContain("Hello World");
  });

  it("returns no matches message", async () => {
    const result = await grepTool.execute({ query: "zzzznotfound", include: "**/*" }, context);
    expect(result.ok).toBe(true);
    expect(result.content).toContain("No matches");
  });
});
