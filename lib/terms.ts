import { asc, desc, eq } from "drizzle-orm";
import { questionnaireVersions, terms } from "@/db/schema";
import { getDb } from "@/lib/db";
import { surveyQuestions } from "@/lib/survey-questions";

export type Term = typeof terms.$inferSelect;
type Db = ReturnType<typeof getDb>;
type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

// 운영 중인 학기는 하나다. 일정 가져오기·현장 평가·운영 현황은 모두 이 학기 기준으로 동작한다.
export async function getActiveTerm(db: Db | Tx = getDb()): Promise<Term | null> {
  const [term] = await db.select().from(terms).where(eq(terms.active, true)).orderBy(desc(terms.startsAt)).limit(1);
  return term ?? null;
}

export async function listTerms(db: Db = getDb()) {
  return db.select().from(terms).orderBy(desc(terms.startsAt), asc(terms.code));
}

// 학기에 설문이 없으면 현재 표준 평가서(lib/survey-questions)로 v1을 만든다.
export async function ensureQuestionnaire(tx: Db | Tx, termId: string) {
  const [existing] = await tx.select({ id: questionnaireVersions.id }).from(questionnaireVersions).where(eq(questionnaireVersions.termId, termId)).limit(1);
  if (existing) return existing.id;
  const [created] = await tx.insert(questionnaireVersions).values({
    termId,
    version: 1,
    title: "강의 평가서",
    questions: surveyQuestions,
  }).returning({ id: questionnaireVersions.id });
  return created.id;
}

export async function getTermQuestionnaireId(termId: string, db: Db = getDb()) {
  const [row] = await db.select({ id: questionnaireVersions.id }).from(questionnaireVersions).where(eq(questionnaireVersions.termId, termId)).orderBy(desc(questionnaireVersions.version)).limit(1);
  return row?.id ?? null;
}

export async function activateTerm(tx: Db | Tx, termId: string) {
  await tx.update(terms).set({ active: false }).where(eq(terms.active, true));
  await tx.update(terms).set({ active: true }).where(eq(terms.id, termId));
  await ensureQuestionnaire(tx, termId);
}
