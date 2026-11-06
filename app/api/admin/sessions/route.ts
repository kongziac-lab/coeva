import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { classes, evaluationSessions } from "@/db/schema";
import { getDb } from "@/lib/db";
import { createPublicToken, encryptPublicToken, hashToken } from "@/lib/security";
import { getAdminSession } from "@/lib/auth";
import { closeExpiredSessions, getPublicSurveyUrl, getSessionSnapshots, recalculateClassTerm, sessionDeadline } from "@/lib/session-monitor";
import { ensureQuestionnaire, getActiveTerm, getTermQuestionnaireId } from "@/lib/terms";

const startInput = z.object({ classId: z.uuid(), targetCount: z.number().int().positive(), durationMinutes: z.number().int().min(1).max(30).optional() });
const restoreInput = z.object({ id: z.uuid(), token: z.string().min(20) });

export async function POST(request: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = startInput.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  try {
    const db = getDb();
    await closeExpiredSessions();
    const [existing] = await db.select({ id: evaluationSessions.id }).from(evaluationSessions).where(and(eq(evaluationSessions.classId, parsed.data.classId), eq(evaluationSessions.status, "ACTIVE"))).limit(1);
    if (existing) return NextResponse.json({ error: "session_already_active" }, { status: 409 });
    const [classRow] = await db.select({ termId: classes.termId }).from(classes).where(eq(classes.id, parsed.data.classId)).limit(1);
    const term = await getActiveTerm(db);
    if (!classRow || !term || classRow.termId !== term.id) return NextResponse.json({ error: "class_not_in_active_term" }, { status: 409 });
    const questionnaireId = await getTermQuestionnaireId(term.id, db) ?? await ensureQuestionnaire(db, term.id);
    const token = createPublicToken();
    const [session] = await db.insert(evaluationSessions).values({
      classId: parsed.data.classId,
      questionnaireId,
      tokenHash: hashToken(token),
      tokenCiphertext: encryptPublicToken(token),
      status: "ACTIVE",
      targetCount: parsed.data.targetCount,
      opensAt: new Date(),
      expiresAt: sessionDeadline(),
    }).returning({ id: evaluationSessions.id, expiresAt: evaluationSessions.expiresAt });
    return NextResponse.json({ id: session.id, classId: parsed.data.classId, url: getPublicSurveyUrl(token, new URL(request.url).origin), targetCount: parsed.data.targetCount, connected: 0, completed: 0, remaining: parsed.data.targetCount, status: "ACTIVE", expiresAt: session.expiresAt?.toISOString() ?? null });
  } catch {
    return NextResponse.json({ error: "service_unavailable" }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = restoreInput.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  try {
    const db = getDb();
    const [session] = await db.select({ id: evaluationSessions.id, tokenHash: evaluationSessions.tokenHash, status: evaluationSessions.status }).from(evaluationSessions).where(eq(evaluationSessions.id, parsed.data.id)).limit(1);
    if (!session || session.status !== "ACTIVE" || hashToken(parsed.data.token) !== session.tokenHash) return NextResponse.json({ error: "invalid_session_token" }, { status: 403 });
    await db.update(evaluationSessions).set({ tokenCiphertext: encryptPublicToken(parsed.data.token) }).where(eq(evaluationSessions.id, session.id));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "service_unavailable" }, { status: 503 });
  }
}

export async function GET(request: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const term = await getActiveTerm();
    const sessions = term ? await getSessionSnapshots(new URL(request.url).origin, term.id) : [];
    return NextResponse.json({ sessions }, { headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "service_unavailable" }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id_required" }, { status: 400 });
  try {
    const db = getDb();
    const [closed] = await db.update(evaluationSessions).set({ status: "CLOSED", closedAt: new Date() }).where(and(eq(evaluationSessions.id, id), eq(evaluationSessions.status, "ACTIVE"))).returning({ classId: evaluationSessions.classId });
    if (closed?.classId) await recalculateClassTerm(closed.classId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "service_unavailable" }, { status: 503 });
  }
}

