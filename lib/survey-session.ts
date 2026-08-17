import { eq, sql } from "drizzle-orm";
import { classes, evaluationSessions, instructors, questionnaireVersions, teachingAssignments } from "@/db/schema";
import { getDb } from "@/lib/db";
import { hashToken } from "@/lib/security";

export type SurveyPayload = {
  classCode: string;
  room: string;
  instructors: Array<{ assignmentId: string; name: string; photoUrl: string | null }>;
  questions: string[];
};

export async function getSurveyPayload(token: string): Promise<SurveyPayload | null> {
  try {
    const db = getDb();
    const [session] = await db.select({ id: evaluationSessions.id, status: evaluationSessions.status, classId: classes.id, classCode: classes.code, room: classes.room, questions: questionnaireVersions.questions })
      .from(evaluationSessions)
      .innerJoin(classes, eq(evaluationSessions.classId, classes.id))
      .innerJoin(questionnaireVersions, eq(evaluationSessions.questionnaireId, questionnaireVersions.id))
      .where(eq(evaluationSessions.tokenHash, hashToken(token)))
      .limit(1);
    if (!session || session.status !== "ACTIVE") return null;
    const assigned = await db.select({ assignmentId: teachingAssignments.id, instructorId: instructors.id, name: instructors.name, hasPhoto: sql<boolean>`${instructors.photoData} is not null` })
      .from(teachingAssignments)
      .innerJoin(instructors, eq(teachingAssignments.instructorId, instructors.id))
      .where(eq(teachingAssignments.classId, session.classId))
      .orderBy(teachingAssignments.position);
    return {
      classCode: session.classCode,
      room: session.room,
      instructors: assigned.map(({ assignmentId, instructorId, name, hasPhoto }) => ({ assignmentId, name, photoUrl: hasPhoto ? `/api/instructors/${instructorId}/photo` : null })),
      questions: (session.questions ?? []) as string[],
    };
  } catch { return null; }
}
