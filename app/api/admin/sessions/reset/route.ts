import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { evaluationSessions } from "@/db/schema";
import { getDb } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { recalculateClassTerm } from "@/lib/session-monitor";

const input = z.object({ classId: z.uuid() });

export async function POST(request: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = input.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  try {
    const result = await getDb().update(evaluationSessions)
      .set({ status: "CLOSED", closedAt: new Date() })
      .where(and(eq(evaluationSessions.classId, parsed.data.classId), eq(evaluationSessions.status, "ACTIVE")))
      .returning({ id: evaluationSessions.id });
    if (result.length) await recalculateClassTerm(parsed.data.classId);
    return NextResponse.json({ ok: true, closedCount: result.length });
  } catch {
    return NextResponse.json({ error: "service_unavailable" }, { status: 503 });
  }
}
