import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import QRCode from "qrcode";
import { z } from "zod";
import { admins } from "@/db/schema";
import { buildTotpUri, decryptTotpSecret, encryptTotpSecret, generateTotpSecret, getAdminSession, verifyPendingMfaToken, verifyTotp } from "@/lib/auth";
import { getDb } from "@/lib/db";

const schema = z.object({ code: z.string().regex(/^\d{6}$/) });
const issuer = () => process.env.TOTP_ISSUER ?? "K-강의평가";

async function qrDataUrl(uri: string) {
  return QRCode.toDataURL(uri, { width: 260, margin: 1, color: { dark: "#102b4e", light: "#ffffff" } });
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    const pendingToken = (await cookies()).get("coeva_mfa_pending")?.value;
    const pending = pendingToken ? await verifyPendingMfaToken(pendingToken) : null;
    if (!pending) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const email = session?.email ?? ((await verifyPendingMfaToken((await cookies()).get("coeva_mfa_pending")?.value ?? ""))?.email as string);

  try {
    const db = getDb();
    const [admin] = await db.select({ totpEnabled: admins.totpEnabled, totpSecret: admins.totpSecret }).from(admins).where(eq(admins.email, email)).limit(1);
    if (admin?.totpEnabled && admin.totpSecret) {
      const secret = decryptTotpSecret(admin.totpSecret);
      if (secret) {
        const uri = buildTotpUri(email, secret, issuer());
        return NextResponse.json({ uri, qr: await qrDataUrl(uri), alreadyEnabled: true });
      }
    }
    const secret = generateTotpSecret();
    const uri = buildTotpUri(email, secret, issuer());
    await db.update(admins).set({ totpSecret: encryptTotpSecret(secret) }).where(eq(admins.email, email));
    return NextResponse.json({ uri, qr: await qrDataUrl(uri), alreadyEnabled: false });
  } catch { return NextResponse.json({ error: "service_unavailable" }, { status: 503 }); }
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    const pendingToken = (await cookies()).get("coeva_mfa_pending")?.value;
    const pending = pendingToken ? await verifyPendingMfaToken(pendingToken) : null;
    if (!pending) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const email = session?.email ?? ((await verifyPendingMfaToken((await cookies()).get("coeva_mfa_pending")?.value ?? ""))?.email as string);

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  try {
    const db = getDb();
    const [admin] = await db.select({ totpSecret: admins.totpSecret }).from(admins).where(eq(admins.email, email)).limit(1);
    if (!admin?.totpSecret) return NextResponse.json({ error: "totp_not_started" }, { status: 400 });
    const secret = decryptTotpSecret(admin.totpSecret);
    if (!secret || !verifyTotp(secret, parsed.data.code)) return NextResponse.json({ error: "invalid_code" }, { status: 401 });
    await db.update(admins).set({ totpEnabled: true, totpVerifiedAt: new Date() }).where(eq(admins.email, email));
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "service_unavailable" }, { status: 503 }); }
}
