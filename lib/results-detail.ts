import { and, asc, desc, eq } from "drizzle-orm";
import { anonymousResponses, classes, evaluationSessions, instructors, questionnaireVersions, teachingAssignments } from "@/db/schema";
import { getDb } from "@/lib/db";
import { surveyQuestions } from "@/lib/survey-questions";
import { buildTermDetail, type TermDetail } from "@/lib/term-detail";

export * from "@/lib/term-detail";

type Db = ReturnType<typeof getDb>;

export async function loadTermDetail(db: Db, termId: string): Promise<TermDetail> {
  const [assignments, responses, questionnaire] = await Promise.all([
    db
      .select({
        assignmentId: teachingAssignments.id,
        classId: classes.id,
        classCode: classes.code,
        room: classes.room,
        eligibleCount: classes.eligibleCount,
        instructorId: instructors.id,
        instructorName: instructors.name,
      })
      .from(teachingAssignments)
      .innerJoin(classes, eq(teachingAssignments.classId, classes.id))
      .innerJoin(instructors, eq(teachingAssignments.instructorId, instructors.id))
      .where(eq(classes.termId, termId))
      .orderBy(asc(classes.code), asc(teachingAssignments.position)),
    db
      .select({ assignmentId: anonymousResponses.assignmentId, answers: anonymousResponses.answers })
      .from(anonymousResponses)
      .innerJoin(evaluationSessions, eq(anonymousResponses.sessionId, evaluationSessions.id))
      .innerJoin(classes, eq(evaluationSessions.classId, classes.id))
      .where(and(eq(classes.termId, termId), eq(anonymousResponses.valid, true))),
    db
      .select({ questions: questionnaireVersions.questions })
      .from(questionnaireVersions)
      .where(eq(questionnaireVersions.termId, termId))
      .orderBy(desc(questionnaireVersions.version))
      .limit(1),
  ]);
  const stored = questionnaire[0]?.questions;
  const questions = Array.isArray(stored) && stored.every((item) => typeof item === "string") ? (stored as string[]) : [...surveyQuestions];
  return buildTermDetail(assignments, responses, questions);
}
