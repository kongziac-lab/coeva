import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { evaluationSessions, participation, questionnaireVersions } from "@/db/schema";
import { getDb } from "@/lib/db";
import { createPublicToken, hashToken } from "@/lib/security";
import { getAdminSession } from "@/lib/auth";

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
  const id = new URL(request.url).searchParams.get("id");
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
    await getDb().update(evaluationSessions).set({ status: "CLOSED", closedAt: new Date() }).where(and(eq(evaluationSessions.id, id), eq(evaluationSessions.status, "ACTIVE")));
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "service_unavailable" }, { status: 503 }); }
}
