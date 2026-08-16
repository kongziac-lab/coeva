import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { generateSecret, generateURI, verifySync } from "otplib";
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";
import { admins } from "@/db/schema";
import { getDb } from "@/lib/db";

const secret = () => new TextEncoder().encode(process.env.SESSION_SECRET ?? "development-only-secret-change-before-production");

export type AdminSession = { email: string; name: string; role: "SYSTEM_ADMIN" | "SURVEY_OPERATOR" | "RESULTS_ADMIN" };
export type PendingMfaSession = AdminSession & { pendingMfa: true };

export function roleForEmail(email: string): AdminSession["role"] {
  const normalized = email.toLowerCase();
  if (normalized.includes("operator") || normalized.startsWith("survey.")) return "SURVEY_OPERATOR";
  if (normalized.includes("result") || normalized.startsWith("evaluation.")) return "RESULTS_ADMIN";
  return "SYSTEM_ADMIN";
}

export async function createAdminToken(session: AdminSession) {
  return new SignJWT(session).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("8h").sign(secret());
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const token = (await cookies()).get("coeva_admin")?.value;
  if (!token) return null;
  try {
    const session = (await jwtVerify(token, secret())).payload as unknown as AdminSession;
    try {
      const rows = await getDb().select({ email: admins.email, name: admins.name, role: admins.role, active: admins.active }).from(admins).where(eq(admins.email, session.email)).limit(1);
      if (rows.length && !rows[0].active) return null;
      if (rows.length) return { email: rows[0].email, name: rows[0].name, role: rows[0].role };
    } catch { /* Local demo mode has no database. */ }
    return session;
  } catch { return null; }
}

export async function createPendingMfaToken(session: AdminSession) {
  return new SignJWT({ ...session, pendingMfa: true }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("5m").sign(secret());
}

export async function verifyPendingMfaToken(token: string): Promise<AdminSession | null> {
  try {
    const payload = (await jwtVerify(token, secret())).payload as unknown as PendingMfaSession;
    if (!payload.pendingMfa) return null;
    return { email: payload.email, name: payload.name, role: payload.role };
  } catch { return null; }
}

export function verifyTotp(secretValue: string, code: string): boolean {
  return verifySync({ token: code, secret: secretValue }).valid;
}

export function generateTotpSecret(): string {
  return generateSecret();
}

export function buildTotpUri(email: string, secret: string, issuer: string): string {
  return generateURI({ issuer, label: email, secret });
}

function getTotpEncryptionKey(): Buffer {
  const raw = process.env.TOTP_ENCRYPTION_KEY ?? process.env.SESSION_SECRET ?? "development-only-secret-change-before-production";
  return scryptSync(raw, "coeva-totp-salt", 32);
}

export function encryptTotpSecret(secretValue: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-gcm", getTotpEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(secretValue, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptTotpSecret(encrypted: string): string | null {
  try {
    const [ivHex, authTagHex, encryptedHex] = encrypted.split(":");
    const decipher = createDecipheriv("aes-256-gcm", getTotpEncryptionKey(), Buffer.from(ivHex, "hex"));
    decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
    return Buffer.concat([decipher.update(Buffer.from(encryptedHex, "hex")), decipher.final()]).toString("utf8");
  } catch { return null; }
}
