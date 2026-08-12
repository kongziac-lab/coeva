import { createHash, randomBytes } from "node:crypto";

export function createPublicToken() { return randomBytes(32).toString("base64url"); }
export function hashToken(value: string) { return createHash("sha256").update(value).digest("hex"); }
export function hashSubject(value: string, sessionId: string) {
  return createHash("sha256").update(`${process.env.SESSION_SECRET ?? "dev"}:${sessionId}:${value}`).digest("hex");
}
