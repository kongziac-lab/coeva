import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { classes, evaluationSessions } from "@/db/schema";
import { getAdminSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { decryptPublicToken } from "@/lib/security";
import { closeExpiredSessions, getPublicSurveyUrl, sessionDeadline } from "@/lib/session-monitor";
import { getActiveTerm } from "@/lib/terms";

const input = z.object({ id: z.uuid() });

// 마감된 평가를 같은 QR로 다시 15분 연다. 같은 세션이므로 이미 제출한 기기는 다시 제출할 수 없다.
export async function POST(request: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  try {
    const db = getDb();
    await closeExpiredSessions();
    const [session] = await db.select({ id: evaluationSessions.id, classId: evaluationSessions.classId, status: evaluationSessions.status, targetCount: evaluationSessions.targetCount, tokenCiphertext: evaluationSessions.tokenCiphertext, termId: classes.termId })
      .from(evaluationSessions).innerJoin(classes, eq(evaluationSessions.classId, classes.id))
      .where(eq(evaluationSessions.id, parsed.data.id)).limit(1);
    if (!session) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const term = await getActiveTerm(db);
    if (!term || session.termId !== term.id) return NextResponse.json({ error: "class_not_in_active_term" }, { status: 409 });
    if (session.status !== "CLOSED") return NextResponse.json({ error: "session_not_closed" }, { status: 409 });
    if (!session.tokenCiphertext) return NextResponse.json({ error: "qr_not_restorable" }, { status: 409 });
    const [otherActive] = await db.select({ id: evaluationSessions.id }).from(evaluationSessions).where(and(eq(evaluationSessions.classId, session.classId), eq(evaluationSessions.status, "ACTIVE"))).limit(1);
    if (otherActive) return NextResponse.json({ error: "session_already_active" }, { status: 409 });

    const token = decryptPublicToken(session.tokenCiphertext);
    const [reopened] = await db.update(evaluationSessions)
      .set({ status: "ACTIVE", closedAt: null, expiresAt: sessionDeadline() })
      .where(and(eq(evaluationSessions.id, session.id), eq(evaluationSessions.status, "CLOSED")))
      .returning({ expiresAt: evaluationSessions.expiresAt });
    if (!reopened) return NextResponse.json({ error: "session_not_closed" }, { status: 409 });
    return NextResponse.json({ id: session.id, classId: session.classId, url: getPublicSurveyUrl(token, new URL(request.url).origin), targetCount: session.targetCount, status: "ACTIVE", expiresAt: reopened.expiresAt?.toISOString() ?? null });
  } catch {
    return NextResponse.json({ error: "service_unavailable" }, { status: 503 });
  }
}
