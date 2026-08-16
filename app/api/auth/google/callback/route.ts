import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { admins } from "@/db/schema";
import { getDb } from "@/lib/db";
import { createAdminToken, createPendingMfaToken } from "@/lib/auth";
import { ensureGoogleAdminSchema } from "@/lib/google-admin-schema";

type GoogleUser = { sub: string; email: string; email_verified?: boolean; name?: string; hd?: string };

type DatabaseError = Error & { code?: string };

function loginFailureMessage(error: unknown) {
  const databaseError = error as DatabaseError;
  console.error("Google OAuth callback failed", {
    name: databaseError?.name,
    code: databaseError?.code,
    message: databaseError?.message,
  });

  if (["42P01", "42703"].includes(databaseError?.code ?? "")) {
    return "관리자 데이터베이스 초기화가 필요합니다. 시스템 관리자에게 문의하세요.";
  }
  if (["ECONNREFUSED", "ENOTFOUND", "ETIMEDOUT", "ECONNRESET"].includes(databaseError?.code ?? "")) {
    return "데이터베이스에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.";
  }
  return "Google 로그인 처리 중 오류가 발생했습니다.";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const storedState = (await cookies()).get("google_oauth_state")?.value;
  const appUrl = process.env.APP_URL ?? url.origin;
  const fail = (reason: string) => NextResponse.redirect(`${appUrl}/login?error=${encodeURIComponent(reason)}`);
  if (!code || !state || !storedState || state !== storedState) return fail("Google 로그인 상태가 만료되었습니다.");
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) return fail("Google OAuth 설정이 없습니다.");
  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ code, client_id: process.env.GOOGLE_CLIENT_ID, client_secret: process.env.GOOGLE_CLIENT_SECRET, redirect_uri: `${appUrl}/api/auth/google/callback`, grant_type: "authorization_code" }) });
    if (!tokenResponse.ok) return fail("Google 인증 토큰을 확인하지 못했습니다.");
    const tokens = await tokenResponse.json() as { access_token?: string };
    if (!tokens.access_token) return fail("Google 인증 토큰이 없습니다.");
    const userResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { authorization: `Bearer ${tokens.access_token}` } });
    if (!userResponse.ok) return fail("Google 사용자 정보를 확인하지 못했습니다.");
    const user = await userResponse.json() as GoogleUser;
    const workspaceDomain = process.env.GOOGLE_WORKSPACE_DOMAIN?.toLowerCase();
    const emailDomain = user.email?.split("@")[1]?.toLowerCase();
    if (!user.email || user.email_verified === false || (workspaceDomain && emailDomain !== workspaceDomain)) return fail("허용된 Google Workspace 계정이 아닙니다.");
    await ensureGoogleAdminSchema();
    const db = getDb();
    const email = user.email.toLowerCase();
    let rows = await db.select().from(admins).where(eq(admins.email, email)).limit(1);
    let admin = rows[0];

    // ADMIN_EMAIL remains the trusted bootstrap identity for the first Workspace login.
    if (!admin && process.env.ADMIN_EMAIL?.toLowerCase() === email) {
      await db.insert(admins).values({
        email,
        name: user.name || email,
        role: "SYSTEM_ADMIN",
        active: true,
        googleSubject: user.sub,
        lastLoginAt: new Date(),
      }).onConflictDoNothing();
      rows = await db.select().from(admins).where(eq(admins.email, email)).limit(1);
      admin = rows[0];
    }

    if (!admin || !admin.active) return fail("관리자 목록에 등록되지 않은 계정입니다. 시스템 관리자에게 등록을 요청하세요.");
    await db.update(admins).set({ googleSubject: user.sub, lastLoginAt: new Date(), name: admin.name || user.name || user.email }).where(eq(admins.id, admin.id));
    const session = { email: admin.email, name: admin.name || user.name || admin.email, role: admin.role };

    if (admin.totpEnabled) {
      const token = await createPendingMfaToken(session);
      const response = NextResponse.redirect(`${appUrl}/login?mfa=1`);
      response.cookies.set("coeva_mfa_pending", token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 5, path: "/" });
      response.cookies.set("google_oauth_state", "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 0, path: "/" });
      return response;
    }

    const token = await createAdminToken(session);
    const response = NextResponse.redirect(`${appUrl}/admin`);
    response.cookies.set("coeva_admin", token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 8, path: "/" });
    response.cookies.set("google_oauth_state", "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 0, path: "/" });
    return response;
  } catch (error) {
    return fail(loginFailureMessage(error));
  }
}
