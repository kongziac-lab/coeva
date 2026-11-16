import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { terms } from "@/db/schema";
import { getAdminSession } from "@/lib/auth";
import { listTermComments } from "@/lib/comments";
import { getDb } from "@/lib/db";
import { languageNamesKo, locales, type Locale } from "@/lib/i18n";
import { getActiveTerm } from "@/lib/terms";

const uuidPattern = /^[0-9a-f-]{36}$/i;

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  // 현장 운영요원은 결과 화면에 들어갈 수 없으므로 자유의견도 내려받을 수 없다.
  if (session.role === "SURVEY_OPERATOR") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const params = new URL(request.url).searchParams;
  const termId = params.get("term");
  const instructorId = params.get("instructor");
  if (termId && !uuidPattern.test(termId)) return NextResponse.json({ error: "invalid_term" }, { status: 400 });
  if (instructorId && !uuidPattern.test(instructorId)) return NextResponse.json({ error: "invalid_instructor" }, { status: 400 });

  const db = getDb();
  const term = termId ? (await db.select().from(terms).where(eq(terms.id, termId)).limit(1))[0] : await getActiveTerm(db);
  if (!term) return NextResponse.json({ error: "term_not_found" }, { status: 404 });

  const rows = await listTermComments(db, term.id, instructorId ?? undefined);
  const header = ["학기", "강사", "분반", "언어", "제출일", "자유의견"];
  const data = rows.map((row) => [
    term.name,
    row.instructorName,
    `${row.classCode}반`,
    locales.includes(row.language as Locale) ? languageNamesKo[row.language as Locale] : row.language,
    row.submittedAt.toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" }),
    row.comment,
  ]);
  // 엑셀이 =, +, -, @ 로 시작하는 학생 입력을 수식으로 실행하지 않도록 앞에 '를 붙인다.
  const cell = (value: unknown) => {
    const text = String(value);
    const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
    return `"${safe.replaceAll('"', '""')}"`;
  };
  const csv = "﻿" + [header, ...data].map((row) => row.map(cell).join(",")).join("\r\n");
  return new NextResponse(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="lecture-evaluation-comments.csv"` } });
}
