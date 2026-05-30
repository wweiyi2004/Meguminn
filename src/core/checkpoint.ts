import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export interface CheckpointInfo {
  timestamp: string;
  originalPath: string;
  backupPath: string;
  sessionId: string;
  reason: string;
}

export function createCheckpoint(cwd: string, filePath: string, sessionId: string, reason: string): CheckpointInfo | null {
  if (!fs.existsSync(filePath)) return null;

  const checkpointsDir = path.join(cwd, ".meguminn", "checkpoints");
  if (!fs.existsSync(checkpointsDir)) {
    fs.mkdirSync(checkpointsDir, { recursive: true });
  }

  const id = crypto.randomUUID().slice(0, 8);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const relPath = path.relative(cwd, filePath).replace(/[\\/]/g, "_");
  const backupName = `${timestamp}_${relPath}_${id}`;
  const backupPath = path.join(checkpointsDir, backupName);

  fs.copyFileSync(filePath, backupPath);

  const info: CheckpointInfo = {
    timestamp: new Date().toISOString(),
    originalPath: filePath,
    backupPath,
    sessionId,
    reason,
  };

  const infoPath = backupPath + ".json";
  fs.writeFileSync(infoPath, JSON.stringify(info, null, 2), "utf-8");

  return info;
}
