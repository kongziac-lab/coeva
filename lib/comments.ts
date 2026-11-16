import { and, asc, count, eq, isNotNull, ne } from "drizzle-orm";
import { anonymousResponses, classes, instructors, teachingAssignments } from "@/db/schema";
import { getDb } from "@/lib/db";

type Db = ReturnType<typeof getDb>;

export type TermComment = {
  id: string;
  instructorId: string;
  instructorName: string;
  classCode: string;
  language: string;
  submittedAt: Date;
  comment: string;
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
