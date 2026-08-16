import { and, eq } from "drizzle-orm";
import { anonymousResponses, classes, evaluationSessions, instructors, teachingAssignments, termResults } from "@/db/schema";
import { getDb } from "@/lib/db";
import { calculateInstructorScore, evaluatePolicy } from "@/lib/policy";

export async function recalculateTermResults(termId: string) {
  const db = getDb();

  const assignments = await db
    .select({
      assignmentId: teachingAssignments.id,
      instructorId: instructors.id,
      classId: classes.id,
      eligibleCount: classes.eligibleCount,
    })
    .from(teachingAssignments)
    .innerJoin(classes, eq(teachingAssignments.classId, classes.id))
    .innerJoin(instructors, eq(teachingAssignments.instructorId, instructors.id))
    .where(eq(classes.termId, termId));

  const responses = await db
    .select({ assignmentId: anonymousResponses.assignmentId, answers: anonymousResponses.answers })
    .from(anonymousResponses)
    .innerJoin(evaluationSessions, eq(anonymousResponses.sessionId, evaluationSessions.id))
    .innerJoin(classes, eq(evaluationSessions.classId, classes.id))
    .where(and(eq(classes.termId, termId), eq(anonymousResponses.valid, true)));

  const byInstructor = new Map<
    string,
    {
      instructorId: string;
      answerSets: number[][];
      responseCount: number;
      eligibleOpportunities: number;
    }
  >();

  for (const assignment of assignments) {
    const existing = byInstructor.get(assignment.instructorId);
    if (existing) {
      existing.eligibleOpportunities += assignment.eligibleCount;
    } else {
      byInstructor.set(assignment.instructorId, {
        instructorId: assignment.instructorId,
        answerSets: [],
        responseCount: 0,
        eligibleOpportunities: assignment.eligibleCount,
      });
    }
  }

  for (const response of responses) {
    const assignment = assignments.find((item) => item.assignmentId === response.assignmentId);
    if (!assignment) continue;
    const entry = byInstructor.get(assignment.instructorId);
    if (!entry) continue;
    entry.answerSets.push(response.answers as number[]);
    entry.responseCount += 1;
  }

  const now = new Date();
  for (const entry of byInstructor.values()) {
    const rawScore = calculateInstructorScore(entry.answerSets);
    const participationRate = entry.eligibleOpportunities > 0 ? entry.responseCount / entry.eligibleOpportunities : 0;
    const decision = evaluatePolicy({
      rawScore,
      responseCount: entry.responseCount,
      eligibleOpportunities: entry.eligibleOpportunities,
    });

    await db
      .insert(termResults)
      .values({
        termId,
        instructorId: entry.instructorId,
        rawScore,
        responseCount: entry.responseCount,
        eligibleOpportunities: entry.eligibleOpportunities,
        participationRate,
        status: decision.status,
        reason: decision.reason,
        calculatedAt: now,
      })
      .onConflictDoUpdate({
        target: [termResults.termId, termResults.instructorId],
        set: {
          rawScore,
          responseCount: entry.responseCount,
          eligibleOpportunities: entry.eligibleOpportunities,
          participationRate,
          status: decision.status,
          reason: decision.reason,
          calculatedAt: now,
        },
      });
  }
}
