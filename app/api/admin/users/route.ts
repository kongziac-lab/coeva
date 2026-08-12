import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { admins } from "@/db/schema";
import { getDb } from "@/lib/db";
import { auditAdminAction, requireSystemAdmin } from "@/lib/admin-access";

const roleSchema = z.enum(["SYSTEM_ADMIN", "SURVEY_OPERATOR", "RESULTS_ADMIN"]);
const createSchema = z.object({ email: z.email(), name: z.string().trim().min(1).max(80), role: roleSchema });
const updateSchema = z.object({ name: z.string().trim().min(1).max(80).optional(), role: roleSchema.optional(), active: z.boolean().optional() });

function publicAdmin(admin: typeof admins.$inferSelect) { return { id: admin.id, email: admin.email, name: admin.name, role: admin.role, active: admin.active, googleSubject: Boolean(admin.googleSubject), lastLoginAt: admin.lastLoginAt, createdAt: admin.createdAt }; }

export async function GET() {
  if (!await requireSystemAdmin()) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  try { const rows = await getDb().select().from(admins).orderBy(desc(admins.createdAt)); return NextResponse.json({ admins: rows.map(publicAdmin) }); } catch { return NextResponse.json({ error: "database_unavailable" }, { status: 503 }); }
}

export async function POST(request: Request) {
  const actor = await requireSystemAdmin(); if (!actor) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const parsed = createSchema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  const domain = process.env.GOOGLE_WORKSPACE_DOMAIN?.toLowerCase(); if (domain && !parsed.data.email.toLowerCase().endsWith(`@${domain}`)) return NextResponse.json({ error: `Workspace 계정(@${domain})만 추가할 수 있습니다.` }, { status: 400 });
  try { const [admin] = await getDb().insert(admins).values({ email: parsed.data.email.toLowerCase(), name: parsed.data.name, role: parsed.data.role, active: true }).returning(); await auditAdminAction(actor.email, "ADMIN_CREATE", admin.id, { email: admin.email, role: admin.role }); return NextResponse.json({ admin: publicAdmin(admin) }, { status: 201 }); } catch (error) { if (error instanceof Error && error.message.toLowerCase().includes("unique")) return NextResponse.json({ error: "이미 등록된 이메일입니다." }, { status: 409 }); return NextResponse.json({ error: "database_unavailable" }, { status: 503 }); }
}
