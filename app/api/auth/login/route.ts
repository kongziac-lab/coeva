import { NextResponse } from "next/server";
import { createAdminToken } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({ email: z.email(), password: z.string().min(1) });

export async function POST(request: Request) {
  const result = schema.safeParse(await request.json());
  if (!result.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  const expectedEmail = process.env.ADMIN_EMAIL ?? "admin@kmu.ac.kr";
  const expectedPassword = process.env.ADMIN_PASSWORD ?? "demo-admin";
  if (result.data.email !== expectedEmail || result.data.password !== expectedPassword) return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  const token = await createAdminToken({ email: expectedEmail, name: "김관리", role: "SYSTEM_ADMIN" });
  const response = NextResponse.json({ ok: true });
  response.cookies.set("coeva_admin", token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 8, path: "/" });
  return response;
}
