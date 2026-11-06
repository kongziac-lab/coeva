import { NextResponse } from "next/server";
import { count, eq } from "drizzle-orm";
import { z } from "zod";
import { classes, evaluationSessions, terms } from "@/db/schema";
import { auditAdminAction, requireSystemAdmin } from "@/lib/admin-access";
import { getDb } from "@/lib/db";
import { activateTerm, ensureQuestionnaire, listTerms } from "@/lib/terms";
import { closeExpiredSessions } from "@/lib/session-monitor";

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const createSchema = z.object({
  code: z.string().trim().regex(/^[A-Za-z0-9-]{3,30}$/, "학기 코드는 영문·숫자·하이픈 3~30자입니다."),
  name: z.string().trim().min(2).max(40),
  startsOn: day,
  endsOn: day,
  activate: z.boolean().default(true),
});
const activateSchema = z.object({ id: z.uuid() });

const kstStart = (value: string) => new Date(`${value}T00:00:00+09:00`);
const kstEnd = (value: string) => new Date(`${value}T23:59:59+09:00`);

const ACTIVE_SESSION_MESSAGE = "진행 중인 현장 평가가 있습니다. 모두 종료한 뒤 학기를 전환해 주세요.";
async function hasActiveSession() {
  await closeExpiredSessions();
  const [row] = await getDb().select({ id: evaluationSessions.id }).from(evaluationSessions).where(eq(evaluationSessions.status, "ACTIVE")).limit(1);
  return Boolean(row);
}

async function payload() {
  const db = getDb();
  const [rows, classCounts] = await Promise.all([
    listTerms(db),
    db.select({ termId: classes.termId, value: count() }).from(classes).groupBy(classes.termId),
  ]);
  const byTerm = new Map(classCounts.map((row) => [row.termId, row.value]));
  return rows.map((term) => ({ id: term.id, code: term.code, name: term.name, startsAt: term.startsAt, endsAt: term.endsAt, active: term.active, classCount: byTerm.get(term.id) ?? 0 }));
}

export async function GET() {
  if (!await requireSystemAdmin()) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  try { return NextResponse.json({ terms: await payload() }, { headers: { "cache-control": "no-store" } }); }
  catch { return NextResponse.json({ error: "database_unavailable" }, { status: 503 }); }
}

export async function POST(request: Request) {
  const actor = await requireSystemAdmin();
  if (!actor) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." }, { status: 400 });
  const { code, name, startsOn, endsOn, activate } = parsed.data;
  if (kstEnd(endsOn) <= kstStart(startsOn)) return NextResponse.json({ error: "종료일은 시작일보다 뒤여야 합니다." }, { status: 400 });
  const normalizedCode = code.toUpperCase();
  try {
    const db = getDb();
    const [duplicate] = await db.select({ id: terms.id }).from(terms).where(eq(terms.code, normalizedCode)).limit(1);
    if (duplicate) return NextResponse.json({ error: "이미 있는 학기 코드입니다." }, { status: 409 });
    if (activate && await hasActiveSession()) return NextResponse.json({ error: ACTIVE_SESSION_MESSAGE }, { status: 409 });
    const term = await db.transaction(async (tx) => {
      const [created] = await tx.insert(terms).values({ code: normalizedCode, name, startsAt: kstStart(startsOn), endsAt: kstEnd(endsOn), active: false }).returning();
      await ensureQuestionnaire(tx, created.id);
      if (activate) await activateTerm(tx, created.id);
      return created;
    });
    await auditAdminAction(actor.email, "TERM_CREATE", term.id, { code: term.code, name: term.name, activate }, "term");
    return NextResponse.json({ terms: await payload() }, { status: 201 });
  } catch { return NextResponse.json({ error: "database_unavailable" }, { status: 503 }); }
}

export async function PATCH(request: Request) {
  const actor = await requireSystemAdmin();
  if (!actor) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const parsed = activateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  try {
    const db = getDb();
    const [term] = await db.select({ id: terms.id, name: terms.name }).from(terms).where(eq(terms.id, parsed.data.id)).limit(1);
    if (!term) return NextResponse.json({ error: "학기를 찾을 수 없습니다." }, { status: 404 });
    if (await hasActiveSession()) return NextResponse.json({ error: ACTIVE_SESSION_MESSAGE }, { status: 409 });
    await db.transaction((tx) => activateTerm(tx, term.id));
    await auditAdminAction(actor.email, "TERM_ACTIVATE", term.id, { name: term.name }, "term");
    return NextResponse.json({ terms: await payload() });
  } catch { return NextResponse.json({ error: "database_unavailable" }, { status: 503 }); }
}
