import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { admins } from "@/db/schema";
import { getDb } from "@/lib/db";
import { auditAdminAction, requireSystemAdmin } from "@/lib/admin-access";

const updateSchema = z.object({ name: z.string().trim().min(1).max(80).optional(), role: z.enum(["SYSTEM_ADMIN", "SURVEY_OPERATOR", "RESULTS_ADMIN"]).optional(), active: z.boolean().optional() });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireSystemAdmin(); if (!actor) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { id } = await params; const parsed = updateSchema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  try { const [target] = await getDb().select({ email: admins.email }).from(admins).where(eq(admins.id, id)).limit(1); if (!target) return NextResponse.json({ error: "not_found" }, { status: 404 }); if (target.email === actor.email && parsed.data.active === false) return NextResponse.json({ error: "현재 로그인한 계정은 비활성화할 수 없습니다." }, { status: 400 }); const [admin] = await getDb().update(admins).set(parsed.data).where(eq(admins.id, id)).returning(); await auditAdminAction(actor.email, "ADMIN_UPDATE", id, parsed.data); return NextResponse.json({ admin }); } catch { return NextResponse.json({ error: "database_unavailable" }, { status: 503 }); }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireSystemAdmin(); if (!actor) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { id } = await params;
  try { const [target] = await getDb().select({ email: admins.email }).from(admins).where(eq(admins.id, id)).limit(1); if (!target) return NextResponse.json({ error: "not_found" }, { status: 404 }); if (target.email === actor.email) return NextResponse.json({ error: "현재 로그인한 계정은 삭제할 수 없습니다." }, { status: 400 }); await getDb().update(admins).set({ active: false }).where(eq(admins.id, id)); await auditAdminAction(actor.email, "ADMIN_DELETE", id, { email: target.email }); return NextResponse.json({ ok: true }); } catch { return NextResponse.json({ error: "database_unavailable" }, { status: 503 }); }
}
