import { hash } from "@node-rs/argon2";
import { eq } from "drizzle-orm";
import { getDb } from "../lib/db";
import { admins, questionnaireVersions, terms } from "./schema";
import { surveyQuestions } from "../lib/survey-questions";

async function seed() {
  const db = getDb();
  const email = process.env.ADMIN_EMAIL;
  if (!email || !process.env.ADMIN_PASSWORD) throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required");
  const normalizedEmail = email.toLowerCase();
  const existing = await db.select().from(admins).where(eq(admins.email, normalizedEmail)).limit(1);
  if (!existing.length) await db.insert(admins).values({ email: normalizedEmail, name: email.split("@")[0], passwordHash: await hash(process.env.ADMIN_PASSWORD), role: "SYSTEM_ADMIN" });

  let [term] = await db.select().from(terms).where(eq(terms.code, "2026-SUMMER")).limit(1);
  if (!term) [term] = await db.insert(terms).values({ code: "2026-SUMMER", name: "2026년 여름학기", startsAt: new Date("2026-06-01T00:00:00+09:00"), endsAt: new Date("2026-08-31T23:59:59+09:00"), active: true }).returning();
  const questionnaires = await db.select().from(questionnaireVersions).where(eq(questionnaireVersions.termId, term.id)).limit(1);
  if (!questionnaires.length) await db.insert(questionnaireVersions).values({ termId: term.id, version: 1, title: "강의 평가서", questions: surveyQuestions });
  console.log("Seed complete");
  process.exit(0);
}

seed().catch((error) => { console.error(error); process.exit(1); });
