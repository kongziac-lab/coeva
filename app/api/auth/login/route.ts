import { NextResponse } from "next/server";
import { createAdminToken, roleForEmail } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({ email: z.email(), password: z.string().min(1) });

export async function POST(request: Request) {
  const result = schema.safeParse(await request.json());
  if (!result.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  const expectedEmail = process.env.ADMIN_EMAIL ?? "admin@kmu.ac.kr";
  const isDefaultAdmin = result.data.email.toLowerCase() === expectedEmail.toLowerCase() && result.data.password === process.env.ADMIN_PASSWORD;
  if (!isDefaultAdmin) return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  const email = result.data.email;
  const token = await createAdminToken({ email, name: email.split("@")[0], role: roleForEmail(email) });
  const response = NextResponse.json({ ok: true });
  response.cookies.set("coeva_admin", token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 8, path: "/" });
  return response;
}
