import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { Message } from "../llm/types.js";

export interface ToolCallRecord {
  toolName: string;
  input: Record<string, unknown>;
  result: string;
  timestamp: string;
}

export interface TodoItem {
  id: string;
  content: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
}

export interface Session {
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  cwd: string;
  messages: Message[];
  task: string;
  toolCalls: ToolCallRecord[];
  todos: TodoItem[];
}

export class SessionManager {
  private sessionsDir: string;

  constructor(cwd: string) {
    this.sessionsDir = path.join(cwd, ".meguminn", "sessions");
    if (!fs.existsSync(this.sessionsDir)) {
      fs.mkdirSync(this.sessionsDir, { recursive: true });
    }
  }

  create(cwd: string, task = ""): Session {
    const session: Session = {
      sessionId: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      cwd,
      messages: [],
      task,
      toolCalls: [],
      todos: [],
    };
    this.save(session);
    return session;
  }

  load(sessionId: string): Session | null {
    const filePath = path.join(this.sessionsDir, `${sessionId}.json`);
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as Session;
  }

  save(session: Session): void {
    session.updatedAt = new Date().toISOString();
    const filePath = path.join(this.sessionsDir, `${session.sessionId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(session, null, 2), "utf-8");
  }

  getLatest(): Session | null {
    if (!fs.existsSync(this.sessionsDir)) return null;
    const files = fs.readdirSync(this.sessionsDir).filter((f) => f.endsWith(".json"));
    if (files.length === 0) return null;

    let latest: Session | null = null;
    let latestTime = 0;

    for (const file of files) {
      const filePath = path.join(this.sessionsDir, file);
      const stat = fs.statSync(filePath);
      if (stat.mtimeMs > latestTime) {
        latestTime = stat.mtimeMs;
        const raw = fs.readFileSync(filePath, "utf-8");
        latest = JSON.parse(raw) as Session;
      }
    }

    return latest;
  }

  addMessage(session: Session, message: Message): void {
    session.messages.push(message);
    this.save(session);
  }

  addToolCall(session: Session, call: ToolCallRecord): void {
    session.toolCalls.push(call);
    this.save(session);
  }

  clear(session: Session): void {
    session.messages = [];
    session.toolCalls = [];
    session.todos = [];
    this.save(session);
  }
}
