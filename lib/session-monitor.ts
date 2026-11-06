import { and, desc, eq, inArray } from "drizzle-orm";
import { classes, evaluationSessions, participation } from "@/db/schema";
import { getDb } from "@/lib/db";
import { decryptPublicToken } from "@/lib/security";
import { recalculateTermResults } from "@/lib/results";

export type SessionSnapshot = {
  classId: string;
  sessionId: string;
  status: "ACTIVE" | "READY";
  targetCount: number;
  connected: number;
  completed: number;
  remaining: number;
  url: string | null;
  updatedAt: string;
};

export function getPublicSurveyUrl(token: string, requestOrigin?: string) {
  const appUrl = process.env.APP_URL ?? requestOrigin ?? "http://localhost:3000";
  return `${appUrl}/survey/${token}`;
}

export async function getSessionSnapshots(requestOrigin?: string, termId?: string): Promise<SessionSnapshot[]> {
  const db = getDb();
  // 반마다 가장 최근 세션 하나만 읽는다(3초 폴링이라 전체 세션 이력을 매번 읽지 않는다).
  const latestSessions = await db.selectDistinctOn([evaluationSessions.classId], {
    id: evaluationSessions.id,
    classId: evaluationSessions.classId,
    targetCount: evaluationSessions.targetCount,
    status: evaluationSessions.status,
    tokenCiphertext: evaluationSessions.tokenCiphertext,
  }).from(evaluationSessions)
    .innerJoin(classes, eq(evaluationSessions.classId, classes.id))
    .where(termId ? eq(classes.termId, termId) : undefined)
    .orderBy(evaluationSessions.classId, desc(evaluationSessions.createdAt));
  const sessionIds = latestSessions.map((session) => session.id);
  const participantRows = sessionIds.length
    ? await db.select({ sessionId: participation.sessionId, status: participation.status, lastSeenAt: participation.lastSeenAt }).from(participation).where(inArray(participation.sessionId, sessionIds))
    : [];
  const rowsBySession = new Map<string, typeof participantRows>();
  for (const row of participantRows) rowsBySession.set(row.sessionId, [...(rowsBySession.get(row.sessionId) ?? []), row]);
  const now = Date.now();

  return latestSessions.map((session) => {
    const rows = rowsBySession.get(session.id) ?? [];
    const completed = rows.filter((row) => row.status === "COMPLETED").length;
    const connected = rows.filter((row) => row.status === "IN_PROGRESS" && row.lastSeenAt && now - row.lastSeenAt.getTime() <= 45_000).length;
    let url: string | null = null;
    if (session.status === "ACTIVE" && session.tokenCiphertext) {
      try { url = getPublicSurveyUrl(decryptPublicToken(session.tokenCiphertext), requestOrigin); } catch { /* Legacy sessions can be restored from the creator browser. */ }
    }
    return {
      classId: session.classId,
      sessionId: session.id,
      status: session.status === "ACTIVE" ? "ACTIVE" : "READY",
      targetCount: session.targetCount,
      connected,
      completed,
      remaining: Math.max(0, session.targetCount - completed),
      url,
      updatedAt: new Date().toISOString(),
    };
  });
}

export async function recalculateClassTerm(classId: string) {
  const [row] = await getDb().select({ termId: classes.termId }).from(classes).where(eq(classes.id, classId)).limit(1);
  if (!row?.termId) return;
  try { await recalculateTermResults(row.termId); } catch { /* Result aggregation failure should not break session closure. */ }
}
