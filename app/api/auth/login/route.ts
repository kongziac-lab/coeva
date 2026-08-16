import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { admins } from "@/db/schema";
import { createAdminToken, createPendingMfaToken, roleForEmail } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { z } from "zod";

const schema = z.object({ email: z.email(), password: z.string().min(1) });

export async function POST(request: Request) {
  const result = schema.safeParse(await request.json());
  if (!result.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  const expectedEmail = process.env.ADMIN_EMAIL ?? "admin@kmu.ac.kr";
  const isDefaultAdmin = result.data.email.toLowerCase() === expectedEmail.toLowerCase() && result.data.password === process.env.ADMIN_PASSWORD;
  if (!isDefaultAdmin) return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  const email = result.data.email;
  const name = email.split("@")[0];
  const role = roleForEmail(email);
  const session = { email, name, role };

  try {
    const db = getDb();
    const [admin] = await db.select({ totpEnabled: admins.totpEnabled }).from(admins).where(eq(admins.email, email)).limit(1);
    if (admin?.totpEnabled) {
      const token = await createPendingMfaToken(session);
      const response = NextResponse.json({ mfaRequired: true });
      response.cookies.set("coeva_mfa_pending", token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 5, path: "/" });
      return response;
    }
  } catch { /* Local demo mode or database unavailable: fall through to full session. */ }

  const token = await createAdminToken(session);
  const response = NextResponse.json({ ok: true });
  response.cookies.set("coeva_admin", token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 8, path: "/" });
  return response;
}
