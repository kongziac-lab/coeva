import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { admins } from "@/db/schema";
import { requireSystemAdmin } from "@/lib/admin-access";
import { getDb } from "@/lib/db";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireSystemAdmin();
  if (!actor) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { id } = await params;
  try {
    const db = getDb();
    const [target] = await db.select({ email: admins.email }).from(admins).where(eq(admins.id, id)).limit(1);
    if (!target) return NextResponse.json({ error: "not_found" }, { status: 404 });
    await db.update(admins).set({ totpEnabled: false, totpSecret: null, totpVerifiedAt: null }).where(eq(admins.id, id));
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "database_unavailable" }, { status: 503 }); }
}
