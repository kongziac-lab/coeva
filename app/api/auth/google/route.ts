import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";

export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const appUrl = process.env.APP_URL ?? new URL(request.url).origin;
  if (!clientId) return NextResponse.json({ error: "google_oauth_not_configured" }, { status: 503 });
  const state = randomBytes(24).toString("base64url");
  (await cookies()).set("google_oauth_state", state, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 600, path: "/" });
  const params = new URLSearchParams({ client_id: clientId, redirect_uri: `${appUrl}/api/auth/google/callback`, response_type: "code", scope: "openid email profile", access_type: "offline", prompt: "select_account", state });
  if (process.env.GOOGLE_WORKSPACE_DOMAIN) params.set("hd", process.env.GOOGLE_WORKSPACE_DOMAIN);
  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}
