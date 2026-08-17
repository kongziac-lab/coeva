import { NextResponse } from "next/server";
import { and, desc, eq, gte, inArray, or } from "drizzle-orm";
import { z } from "zod";
import { classes, evaluationSessions, participation, questionnaireVersions } from "@/db/schema";
import { getDb } from "@/lib/db";
import { createPublicToken, hashToken } from "@/lib/security";
import { getAdminSession } from "@/lib/auth";
import { recalculateTermResults } from "@/lib/results";

const input = z.object({ classId: z.uuid(), targetCount: z.number().int().positive(), durationMinutes: z.number().int().min(1).max(30).optional() });

export async function POST(request: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = input.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  try {
    const db = getDb();
    const [questionnaire] = await db.select({ id: questionnaireVersions.id }).from(questionnaireVersions).limit(1);
    if (!questionnaire) return NextResponse.json({ error: "questionnaire_required" }, { status: 409 });
    const token = createPublicToken();
    const now = new Date();
    const [session] = await db.insert(evaluationSessions).values({ classId: parsed.data.classId, questionnaireId: questionnaire.id, tokenHash: hashToken(token), status: "ACTIVE", targetCount: parsed.data.targetCount, opensAt: now, expiresAt: null }).returning({ id: evaluationSessions.id });
    return NextResponse.json({ id: session.id, url: `${process.env.APP_URL ?? "http://localhost:3000"}/survey/${token}` });
  } catch { return NextResponse.json({ error: "service_unavailable" }, { status: 503 }); }
}

export async function GET(request: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  if (url.searchParams.get("all") === "1") {
    try {
      const db = getDb();
      const cutoff = new Date(Date.now() - 24 * 3600 * 1000);
      const sessions = await db.select({ id: evaluationSessions.id, classId: evaluationSessions.classId, targetCount: evaluationSessions.targetCount, status: evaluationSessions.status })
        .from(evaluationSessions)
        .where(or(eq(evaluationSessions.status, "ACTIVE"), gte(evaluationSessions.opensAt, cutoff)))
        .orderBy(desc(evaluationSessions.opensAt))
        .limit(100);
      const ids = sessions.map((session) => session.id);
      const rows = ids.length ? await db.select({ sessionId: participation.sessionId, status: participation.status, lastSeenAt: participation.lastSeenAt }).from(participation).where(inArray(participation.sessionId, ids)) : [];
      const now = Date.now();
      const bySession = new Map<string, { connected: number; completed: number }>();
      for (const row of rows) {
        const entry = bySession.get(row.sessionId) ?? { connected: 0, completed: 0 };
        if (row.status === "COMPLETED") entry.completed += 1;
        if (row.status === "IN_PROGRESS" && row.lastSeenAt && now - row.lastSeenAt.getTime() <= 45_000) entry.connected += 1;
        bySession.set(row.sessionId, entry);
      }
      const stats: Record<string, { targetCount: number; connected: number; completed: number; remaining: number; status: string }> = {};
      for (const session of sessions) {
        const existing = stats[session.classId];
        if (existing?.status === "ACTIVE" && session.status !== "ACTIVE") continue;
        const counts = bySession.get(session.id) ?? { connected: 0, completed: 0 };
        stats[session.classId] = { targetCount: session.targetCount, connected: counts.connected, completed: counts.completed, remaining: Math.max(0, session.targetCount - counts.completed), status: session.status };
      }
      return NextResponse.json({ stats }, { headers: { "cache-control": "no-store" } });
    } catch { return NextResponse.json({ error: "service_unavailable" }, { status: 503 }); }
  }
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id_required" }, { status: 400 });
  try {
    const db = getDb();
    const [session] = await db.select({ id: evaluationSessions.id, targetCount: evaluationSessions.targetCount, status: evaluationSessions.status }).from(evaluationSessions).where(eq(evaluationSessions.id, id)).limit(1);
    if (!session) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const rows = await db.select({ status: participation.status, lastSeenAt: participation.lastSeenAt }).from(participation).where(eq(participation.sessionId, id));
    const now = Date.now();
    const connected = rows.filter((row) => row.status === "IN_PROGRESS" && row.lastSeenAt && now - row.lastSeenAt.getTime() <= 45_000).length;
    const inProgress = rows.filter((row) => row.status === "IN_PROGRESS").length;
    const completed = rows.filter((row) => row.status === "COMPLETED").length;
    return NextResponse.json({ targetCount: session.targetCount, connected, inProgress, completed, remaining: Math.max(0, session.targetCount - completed), status: session.status, updatedAt: new Date().toISOString() }, { headers: { "cache-control": "no-store" } });
  } catch { return NextResponse.json({ error: "service_unavailable" }, { status: 503 }); }
}

export async function DELETE(request: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id_required" }, { status: 400 });
  try {
    const db = getDb();
    const [closed] = await db.update(evaluationSessions).set({ status: "CLOSED", closedAt: new Date() }).where(and(eq(evaluationSessions.id, id), eq(evaluationSessions.status, "ACTIVE"))).returning({ classId: evaluationSessions.classId });
    if (closed?.classId) {
      const [row] = await db.select({ termId: classes.termId }).from(classes).where(eq(classes.id, closed.classId)).limit(1);
      if (row?.termId) {
        try { await recalculateTermResults(row.termId); } catch { /* Result aggregation failure should not break session closure. */ }
      }
    }
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "service_unavailable" }, { status: 503 }); }
}
