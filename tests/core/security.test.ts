import { describe, it, expect } from "vitest";
import { safeResolve, isSensitiveFile, classifyCommandRisk } from "../../src/utils/security.js";

describe("safeResolve", () => {
  it("resolves paths within project", () => {
    const cwd = process.cwd();
    const result = safeResolve(cwd, "src/index.ts");
    expect(result).toContain("src");
    expect(result).toContain("index.ts");
    expect(result.startsWith(cwd)).toBe(true);
  });

  it("blocks path traversal with ../", () => {
    const cwd = process.cwd();
    expect(() => safeResolve(cwd, "../secret")).toThrow();
    expect(() => safeResolve(cwd, "../../etc/passwd")).toThrow();
    expect(() => safeResolve(cwd, "src/../../secret")).toThrow();
  });

  it("blocks absolute paths outside project", () => {
    const cwd = process.cwd();
    const isWindows = process.platform === "win32";
    if (isWindows) {
      expect(() => safeResolve(cwd, "C:\\Windows\\System32")).toThrow();
    } else {
      expect(() => safeResolve(cwd, "/etc/passwd")).toThrow();
      expect(() => safeResolve(cwd, "/home/user/.ssh/id_rsa")).toThrow();
    }
  });
});

describe("isSensitiveFile", () => {
  it("detects .env files", () => {
    expect(isSensitiveFile(".env")).toBe(true);
    expect(isSensitiveFile(".env.local")).toBe(true);
    expect(isSensitiveFile(".env.production")).toBe(true);
  });

  it("detects key files", () => {
    expect(isSensitiveFile("id_rsa")).toBe(true);
    expect(isSensitiveFile("id_ed25519")).toBe(true);
    expect(isSensitiveFile("server.pem")).toBe(true);
    expect(isSensitiveFile("private.key")).toBe(true);
  });

  it("detects secrets files", () => {
    expect(isSensitiveFile("secrets.json")).toBe(true);
    expect(isSensitiveFile("credentials.yaml")).toBe(true);
  });

  it("allows normal files", () => {
    expect(isSensitiveFile("index.ts")).toBe(false);
    expect(isSensitiveFile("README.md")).toBe(false);
    expect(isSensitiveFile("package.json")).toBe(false);
  });
});

describe("classifyCommandRisk", () => {
  it("classifies safe commands", () => {
    expect(classifyCommandRisk("git status")).toBe("safe");
    expect(classifyCommandRisk("git diff")).toBe("safe");
    expect(classifyCommandRisk("pnpm test")).toBe("safe");
    expect(classifyCommandRisk("pnpm build")).toBe("safe");
    expect(classifyCommandRisk("ls")).toBe("safe");
  });

  it("classifies medium risk commands", () => {
    expect(classifyCommandRisk("rm file.txt")).toBe("medium");
    expect(classifyCommandRisk("git reset --hard")).toBe("medium");
    expect(classifyCommandRisk("git clean -fd")).toBe("medium");
    expect(classifyCommandRisk("npm publish")).toBe("medium");
    expect(classifyCommandRisk("git push --force")).toBe("medium");
  });

  it("classifies dangerous commands", () => {
    expect(classifyCommandRisk("rm -rf /")).toBe("dangerous");
    expect(classifyCommandRisk("rm -rf *")).toBe("dangerous");
    expect(classifyCommandRisk("sudo rm -rf /tmp")).toBe("dangerous");
    expect(classifyCommandRisk("chmod -R 777 /")).toBe("dangerous");
    expect(classifyCommandRisk("mkfs /dev/sda")).toBe("dangerous");
  });
});
