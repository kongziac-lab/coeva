import { eq } from "drizzle-orm";
import { admins } from "@/db/schema";
import { getAdminSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function requireSystemAdmin() {
  const session = await getAdminSession();
  if (!session || session.role !== "SYSTEM_ADMIN") return null;
  return session;
}

export async function auditAdminAction(email: string, action: string, entityId: string | null, detail: Record<string, unknown>, entityType = "admin") {
  try {
    const db = getDb();
    const actor = await db.select({ id: admins.id }).from(admins).where(eq(admins.email, email)).limit(1);
    const { auditLogs } = await import("@/db/schema");
    await db.insert(auditLogs).values({ actorId: actor[0]?.id, action, entityType, entityId, detail });
  } catch { /* Audit logging must not make a valid admin action fail. */ }
}
