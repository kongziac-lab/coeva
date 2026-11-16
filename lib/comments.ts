import { and, asc, count, eq, inArray, isNotNull, isNull, ne, type SQL } from "drizzle-orm";
import { anonymousResponses, classes, instructors, teachingAssignments } from "@/db/schema";
import { getDb } from "@/lib/db";
import { isMostlyKorean, translateComments, translationEnabled } from "@/lib/translate";

type Db = ReturnType<typeof getDb>;

export type TermComment = {
  id: string;
  instructorId: string;
  instructorName: string;
  classCode: string;
  language: string;
  submittedAt: Date;
  comment: string;
  commentKo: string | null;
};

// 자유의견은 익명 응답에 붙어 저장된다. 빈 문자열은 제출 시 null로 바뀌지만, 혹시 남은 공백 값도 제외한다.
function termCommentFilter(termId: string, instructorId?: string) {
  return and(
    eq(classes.termId, termId),
    eq(anonymousResponses.valid, true),
    isNotNull(anonymousResponses.comment),
    ne(anonymousResponses.comment, ""),
    instructorId ? eq(teachingAssignments.instructorId, instructorId) : undefined,
  );
}

export async function listTermComments(db: Db, termId: string, instructorId?: string): Promise<TermComment[]> {
  const rows = await db
    .select({
      id: anonymousResponses.id,
      instructorId: instructors.id,
      instructorName: instructors.name,
      classCode: classes.code,
      language: anonymousResponses.language,
      submittedAt: anonymousResponses.submittedAt,
      comment: anonymousResponses.comment,
      commentKo: anonymousResponses.commentKo,
    })
    .from(anonymousResponses)
    .innerJoin(teachingAssignments, eq(anonymousResponses.assignmentId, teachingAssignments.id))
    .innerJoin(instructors, eq(teachingAssignments.instructorId, instructors.id))
    .innerJoin(classes, eq(teachingAssignments.classId, classes.id))
    .where(termCommentFilter(termId, instructorId))
    .orderBy(asc(instructors.name), asc(classes.code), asc(anonymousResponses.submittedAt));
  return rows.map((row) => ({ ...row, comment: row.comment ?? "" }));
}

export async function countTermCommentsByInstructor(db: Db, termId: string): Promise<Map<string, number>> {
  const rows = await db
    .select({ instructorId: teachingAssignments.instructorId, value: count() })
    .from(anonymousResponses)
    .innerJoin(teachingAssignments, eq(anonymousResponses.assignmentId, teachingAssignments.id))
    .innerJoin(classes, eq(teachingAssignments.classId, classes.id))
    .where(termCommentFilter(termId))
    .groupBy(teachingAssignments.instructorId);
  return new Map(rows.map((row) => [row.instructorId, Number(row.value)]));
}

// 아직 번역 여부를 정하지 않은 자유의견을 처리한다. 한국어 의견은 번역 없이 처리 완료로 표시하고,
// 번역에 실패한 의견은 그대로 두어 다음 호출에서 다시 시도한다.
async function translatePending(db: Db, scope: SQL | undefined, limit: number) {
  if (!translationEnabled()) return 0;
  const pending = await db
    .select({ id: anonymousResponses.id, comment: anonymousResponses.comment, language: anonymousResponses.language })
    .from(anonymousResponses)
    .innerJoin(teachingAssignments, eq(anonymousResponses.assignmentId, teachingAssignments.id))
    .innerJoin(classes, eq(teachingAssignments.classId, classes.id))
    .where(and(scope, isNotNull(anonymousResponses.comment), ne(anonymousResponses.comment, ""), isNull(anonymousResponses.commentTranslatedAt)))
    .orderBy(asc(anonymousResponses.submittedAt))
    .limit(limit);
  if (pending.length === 0) return 0;

  const now = new Date();
  const korean = pending.filter((row) => isMostlyKorean(row.comment ?? ""));
  const foreign = pending.filter((row) => !isMostlyKorean(row.comment ?? ""));
  if (korean.length) await db.update(anonymousResponses).set({ commentTranslatedAt: now }).where(inArray(anonymousResponses.id, korean.map((row) => row.id)));

  const translated = await translateComments(foreign.map((row) => ({ id: row.id, text: row.comment ?? "", language: row.language })));
  for (const [id, commentKo] of translated) {
    await db.update(anonymousResponses).set({ commentKo, commentTranslatedAt: now }).where(eq(anonymousResponses.id, id));
  }
  return korean.length + translated.size;
}

// 관리자가 자유의견 화면을 열 때 밀린 번역을 채운다. 화면이 너무 늦어지지 않게 한 번에 처리하는 양을 제한한다.
export function translatePendingTermComments(db: Db, termId: string, limit = 100) {
  return translatePending(db, eq(classes.termId, termId), limit);
}

// 학생이 제출한 직후 해당 응답의 자유의견만 번역한다.
export function translateResponseComments(db: Db, responseIds: string[]) {
  if (responseIds.length === 0) return Promise.resolve(0);
  return translatePending(db, inArray(anonymousResponses.id, responseIds), responseIds.length);
}
