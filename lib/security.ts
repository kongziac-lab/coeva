import { createHash, randomBytes } from "node:crypto";

const DEV_ONLY_SECRET = "development-only-secret-change-before-production";
// 운영 환경에서는 비밀키가 없으면 개발용 기본값으로 돌지 않고 바로 오류를 낸다.
export function requireSecret(value: string | undefined, name: string): string {
  if (value && value.trim()) return value;
  if (process.env.NODE_ENV === "production") throw new Error(`${name} 환경 변수가 설정되지 않았습니다.`);
  return DEV_ONLY_SECRET;
}

export function createPublicToken() { return randomBytes(32).toString("base64url"); }
export function hashToken(value: string) { return createHash("sha256").update(value).digest("hex"); }
export function hashSubject(value: string, sessionId: string) {
  return createHash("sha256").update(`${requireSecret(process.env.SESSION_SECRET, "SESSION_SECRET")}:${sessionId}:${value}`).digest("hex");
}
