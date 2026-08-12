import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secret = () => new TextEncoder().encode(process.env.SESSION_SECRET ?? "development-only-secret-change-before-production");

export type AdminSession = { email: string; name: string; role: "SYSTEM_ADMIN" | "SURVEY_OPERATOR" | "RESULTS_ADMIN" };

export async function createAdminToken(session: AdminSession) {
  return new SignJWT(session).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("8h").sign(secret());
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const token = (await cookies()).get("coeva_admin")?.value;
  if (!token) return null;
  try { return (await jwtVerify(token, secret())).payload as unknown as AdminSession; } catch { return null; }
}
