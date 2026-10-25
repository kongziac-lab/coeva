import { NextResponse } from "next/server";
import { and, eq, gte, sql } from "drizzle-orm";
import { createHash, timingSafeEqual } from "node:crypto";
import { admins, auditLogs } from "@/db/schema";
import { createAdminToken, createPendingMfaToken, roleForEmail } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { z } from "zod";

const schema = z.object({ email: z.email(), password: z.string().min(1) });

// 로그인 시도 제한: 같은 계정 15분에 5회, 같은 IP 15분에 20회 실패하면 잠시 막는다.
// 실패 기록은 audit_logs에 남기며, 이메일·IP 원문 대신 해시만 저장한다.
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS_PER_ACCOUNT = 5;
const MAX_FAILS_PER_IP = 20;
const isProduction = () => process.env.NODE_ENV === "production";
const digest = (value: string) => createHash("sha256").update(value).digest();
const keyOf = (prefix: string, value: string) => `${prefix}:${digest(value).toString("hex").slice(0, 32)}`;
function safeEqual(a: string, b: string) { return timingSafeEqual(digest(a), digest(b)); }
function clientIp(request: Request) {
  return (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || request.headers.get("x-real-ip") || "unknown";
}

async function recentFailures(entityId: string) {
  const since = new Date(Date.now() - WINDOW_MS);
  const [row] = await getDb()
    .select({ n: sql<number>`count(*)::int` })
    .from(auditLogs)
    .where(and(eq(auditLogs.action, "login_failed"), eq(auditLogs.entityType, "admin_login"), eq(auditLogs.entityId, entityId), gte(auditLogs.createdAt, since)));
  return row?.n ?? 0;
}

async function recordFailure(accountKey: string, ipKey: string) {
  await getDb().insert(auditLogs).values([
    { action: "login_failed", entityType: "admin_login", entityId: accountKey, detail: { by: "account" } },
    { action: "login_failed", entityType: "admin_login", entityId: ipKey, detail: { by: "ip" } },
  ]);
}

export async function POST(request: Request) {
  const result = schema.safeParse(await request.json());
  if (!result.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  const email = result.data.email.toLowerCase();
  const accountKey = keyOf("acct", email);
  const ipKey = keyOf("ip", clientIp(request));

  try {
    if ((await recentFailures(accountKey)) >= MAX_FAILS_PER_ACCOUNT || (await recentFailures(ipKey)) >= MAX_FAILS_PER_IP) {
      return NextResponse.json({ error: "too_many_attempts" }, { status: 429 });
    }
  } catch {
    // 운영 환경에서는 시도 제한을 확인할 수 없으면 로그인하지 않는다. 로컬 데모(DB 없음)만 통과.
    if (isProduction()) return NextResponse.json({ error: "service_unavailable" }, { status: 503 });
  }

  const expectedEmail = (process.env.ADMIN_EMAIL ?? (isProduction() ? "" : "admin@kmu.ac.kr")).toLowerCase();
  const expectedPassword = process.env.ADMIN_PASSWORD ?? "";
  const isDefaultAdmin = Boolean(expectedEmail && expectedPassword) && safeEqual(email, expectedEmail) && safeEqual(result.data.password, expectedPassword);
  if (!isDefaultAdmin) {
    try { await recordFailure(accountKey, ipKey); } catch { /* 로컬 데모(DB 없음) */ }
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  const name = email.split("@")[0];
  const role = roleForEmail(email);
  const session = { email, name, role };

  try {
    const db = getDb();
    const [admin] = await db.select({ totpEnabled: admins.totpEnabled }).from(admins).where(eq(admins.email, email)).limit(1);
    if (admin?.totpEnabled) {
      const token = await createPendingMfaToken(session);
      const response = NextResponse.json({ mfaRequired: true });
      response.cookies.set("coeva_mfa_pending", token, { httpOnly: true, sameSite: "lax", secure: isProduction(), maxAge: 60 * 5, path: "/" });
      return response;
    }
  } catch {
    // 운영 환경에서 DB를 못 읽으면 2단계 인증 여부를 알 수 없으므로 로그인을 막는다(이전에는 그대로 통과).
    if (isProduction()) return NextResponse.json({ error: "service_unavailable" }, { status: 503 });
  }

  const token = await createAdminToken(session);
  const response = NextResponse.json({ ok: true });
  response.cookies.set("coeva_admin", token, { httpOnly: true, sameSite: "lax", secure: isProduction(), maxAge: 60 * 60 * 8, path: "/" });
  return response;
}
