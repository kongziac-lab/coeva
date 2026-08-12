import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { admins } from "@/db/schema";
import { getDb } from "@/lib/db";

const secret = () => new TextEncoder().encode(process.env.SESSION_SECRET ?? "development-only-secret-change-before-production");

export type AdminSession = { email: string; name: string; role: "SYSTEM_ADMIN" | "SURVEY_OPERATOR" | "RESULTS_ADMIN" };

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
