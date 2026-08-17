import { NextResponse } from "next/server";
import { count, eq } from "drizzle-orm";
import { anonymousResponses, evaluationSessions, participation, termResults } from "@/db/schema";
import { getDb } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

export async function GET() {
  const admin = await getAdminSession();
  if (!admin || admin.role !== "SYSTEM_ADMIN") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const db = getDb();
    const [[sessions], [responses], [participants], [results]] = await Promise.all([
      db.select({ value: count() }).from(evaluationSessions),
      db.select({ value: count() }).from(anonymousResponses),
      db.select({ value: count() }).from(participation),
      db.select({ value: count() }).from(termResults),
    ]);
    return NextResponse.json({ sessions: sessions.value, responses: responses.value, participants: participants.value, results: results.value });
  } catch { return NextResponse.json({ error: "service_unavailable" }, { status: 503 }); }
}

export async function DELETE() {
  const admin = await getAdminSession();
  if (!admin || admin.role !== "SYSTEM_ADMIN") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const db = getDb();
    const [deletedResponses] = await db.delete(anonymousResponses).returning({ id: anonymousResponses.id });
    const [deletedParticipation] = await db.delete(participation).returning({ id: participation.id });
    const [deletedSessions] = await db.delete(evaluationSessions).returning({ id: evaluationSessions.id });
    const [deletedResults] = await db.delete(termResults).returning({ id: termResults.id });
    return NextResponse.json({ ok: true, deleted: { responses: deletedResponses ? "cleared" : "empty", participation: deletedParticipation ? "cleared" : "empty", sessions: deletedSessions ? "cleared" : "empty", results: deletedResults ? "cleared" : "empty" } });
  } catch (e) { return NextResponse.json({ error: "service_unavailable", detail: String(e) }, { status: 503 }); }
}
