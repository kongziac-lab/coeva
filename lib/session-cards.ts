import { asc, desc, eq, inArray, sql } from "drizzle-orm";
import { classes, evaluationSessions, instructors, teachingAssignments } from "@/db/schema";
import { getDb } from "@/lib/db";
import { createPublicToken, decryptPublicToken, encryptPublicToken, hashToken } from "@/lib/security";
import { getPublicSurveyUrl } from "@/lib/session-monitor";
import { ensureQuestionnaire, getTermQuestionnaireId } from "@/lib/terms";

export type ClassCard = { classId: string; classCode: string; room: string; instructors: string[]; url: string };

const classNumber = (value: string) => Number(String(value).match(/\d+/)?.[0] ?? Number.MAX_SAFE_INTEGER);

// 운영 학기의 반마다 인쇄용 QR을 준비한다.
// 반의 가장 최근 세션에 QR 정보가 있으면 그 QR을 쓰고, 없으면 아직 열리지 않은(DRAFT) 세션을 만든다.
// DRAFT QR은 운영요원이 "열기"를 누르기 전까지 학생이 제출할 수 없다.
export async function prepareClassCards(termId: string, requestOrigin?: string): Promise<ClassCard[]> {
  const db = getDb();
  const classRows = await db.select({ id: classes.id, code: classes.code, room: classes.room }).from(classes).where(eq(classes.termId, termId)).orderBy(asc(classes.code));
  if (!classRows.length) return [];
  const classIds = classRows.map((row) => row.id);
  const assignmentRows = await db.select({ classId: teachingAssignments.classId, name: instructors.name })
    .from(teachingAssignments).innerJoin(instructors, eq(teachingAssignments.instructorId, instructors.id))
    .where(inArray(teachingAssignments.classId, classIds)).orderBy(asc(teachingAssignments.position));

  const tokens = await db.transaction(async (tx) => {
    // 두 사람이 동시에 카드를 만들어도 반마다 QR이 하나만 생기도록 학기 단위로 잠근다.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`coeva-cards:${termId}`}))`);
    const latest = await tx.selectDistinctOn([evaluationSessions.classId], { classId: evaluationSessions.classId, tokenCiphertext: evaluationSessions.tokenCiphertext })
      .from(evaluationSessions).where(inArray(evaluationSessions.classId, classIds))
      .orderBy(evaluationSessions.classId, desc(evaluationSessions.createdAt));
    const byClass = new Map<string, string>();
    for (const row of latest) {
      if (!row.tokenCiphertext) continue;
      try { byClass.set(row.classId, decryptPublicToken(row.tokenCiphertext)); } catch { /* Create a fresh card below. */ }
    }
    const missing = classRows.filter((row) => !byClass.has(row.id));
    if (missing.length) {
      const questionnaireId = await getTermQuestionnaireId(termId) ?? await ensureQuestionnaire(tx, termId);
      const eligible = await tx.select({ id: classes.id, eligibleCount: classes.eligibleCount }).from(classes).where(inArray(classes.id, missing.map((row) => row.id)));
      const eligibleById = new Map(eligible.map((row) => [row.id, row.eligibleCount]));
      const drafts = missing.map((row) => ({ classId: row.id, token: createPublicToken() }));
      await tx.insert(evaluationSessions).values(drafts.map((draft) => ({
        classId: draft.classId,
        questionnaireId,
        tokenHash: hashToken(draft.token),
        tokenCiphertext: encryptPublicToken(draft.token),
        status: "DRAFT" as const,
        targetCount: Math.max(1, eligibleById.get(draft.classId) ?? 1),
        opensAt: null,
        expiresAt: null,
      })));
      for (const draft of drafts) byClass.set(draft.classId, draft.token);
    }
    return byClass;
  });

  return [...classRows]
    .sort((a, b) => classNumber(a.code) - classNumber(b.code) || a.code.localeCompare(b.code, "ko"))
    .map((row) => ({
      classId: row.id,
      classCode: String(row.code),
      room: row.room,
      instructors: assignmentRows.filter((item) => item.classId === row.id).map((item) => item.name),
      url: getPublicSurveyUrl(tokens.get(row.id)!, requestOrigin),
    }));
}
