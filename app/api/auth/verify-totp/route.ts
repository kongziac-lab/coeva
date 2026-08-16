import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { admins } from "@/db/schema";
import { createAdminToken, decryptTotpSecret, verifyPendingMfaToken, verifyTotp } from "@/lib/auth";
import { getDb } from "@/lib/db";

const schema = z.object({ code: z.string().regex(/^\d{6}$/) });

export async function POST(request: Request) {
  const token = (await cookies()).get("coeva_mfa_pending")?.value;
  const session = token ? await verifyPendingMfaToken(token) : null;
  if (!session) return NextResponse.json({ error: "mfa_expired" }, { status: 401 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  try {
    const db = getDb();
    const [admin] = await db.select({ totpEnabled: admins.totpEnabled, totpSecret: admins.totpSecret }).from(admins).where(eq(admins.email, session.email)).limit(1);
    if (!admin?.totpEnabled || !admin.totpSecret) return NextResponse.json({ error: "mfa_not_configured" }, { status: 401 });
    const secret = decryptTotpSecret(admin.totpSecret);
    if (!secret || !verifyTotp(secret, parsed.data.code)) return NextResponse.json({ error: "invalid_code" }, { status: 401 });
  } catch { return NextResponse.json({ error: "service_unavailable" }, { status: 503 }); }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("coeva_admin", await createAdminToken(session), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 8, path: "/" });
  response.cookies.set("coeva_mfa_pending", "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 0, path: "/" });
  return response;
}
