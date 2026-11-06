import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const DEV_ONLY_SECRET = "development-only-secret-change-before-production";
// 운영 환경에서는 비밀키가 없으면 개발용 기본값으로 돌지 않고 바로 오류를 낸다.
export function requireSecret(value: string | undefined, name: string): string {
  if (value && value.trim()) return value;
  if (process.env.NODE_ENV === "production") throw new Error(`${name} 환경 변수가 설정되지 않았습니다.`);
  return DEV_ONLY_SECRET;
}

export function createPublicToken() { return randomBytes(32).toString("base64url"); }
export function hashToken(value: string) { return createHash("sha256").update(value).digest("hex"); }
// 진행 중인 QR을 다른 기기·새로고침 후에도 다시 띄울 수 있도록 공개 토큰을 암호화해 보관한다.
function tokenKey() { return createHash("sha256").update(requireSecret(process.env.SESSION_SECRET, "SESSION_SECRET")).digest(); }
export function encryptPublicToken(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", tokenKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return `${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${encrypted.toString("base64url")}`;
}
export function decryptPublicToken(value: string) {
  const [ivValue, tagValue, encryptedValue] = value.split(".");
  if (!ivValue || !tagValue || !encryptedValue) throw new Error("invalid_token_ciphertext");
  const decipher = createDecipheriv("aes-256-gcm", tokenKey(), Buffer.from(ivValue, "base64url"));
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(encryptedValue, "base64url")), decipher.final()]).toString("utf8");
}
export function hashSubject(value: string, sessionId: string) {
  return createHash("sha256").update(`${requireSecret(process.env.SESSION_SECRET, "SESSION_SECRET")}:${sessionId}:${value}`).digest("hex");
}
