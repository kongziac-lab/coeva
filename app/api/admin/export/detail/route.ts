import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { eq } from "drizzle-orm";
import { terms } from "@/db/schema";
import { getAdminSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { DETAIL_MIN_RESPONSES, loadTermDetail } from "@/lib/results-detail";
import { getActiveTerm } from "@/lib/terms";

const uuidPattern = /^[0-9a-f-]{36}$/i;
type Cell = string | number | null;

// 엑셀이 =, +, -, @ 로 시작하는 글자를 수식으로 실행하지 않도록 앞에 '를 붙인다.
const text = (value: string) => (/^[=+\-@\t\r]/.test(value) ? `'${value}` : value);
const hidden = `응답 ${DETAIL_MIN_RESPONSES}건 미만 · 문항 점수 비공개`;

// 표 하나를 시트로 만든다. 점수 열은 소수 둘째 자리, 참여율 열은 백분율로 보이게 한다.
function sheet(header: string[], rows: Cell[][], formats: Record<number, string>, widths: number[]) {
  const ws = XLSX.utils.aoa_to_sheet([header, ...rows.map((row) => row.map((value) => (typeof value === "string" ? text(value) : value)))]);
  rows.forEach((row, r) => row.forEach((value, c) => {
    const cell = ws[XLSX.utils.encode_cell({ r: r + 1, c })];
    if (cell && typeof value === "number" && formats[c]) cell.z = formats[c];
  }));
  ws["!cols"] = widths.map((wch) => ({ wch }));
  ws["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rows.length, c: header.length - 1 } }) };
  return ws;
}

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  // 현장 운영요원은 결과 화면에 들어갈 수 없으므로 상세 결과도 내려받을 수 없다.
  if (session.role === "SURVEY_OPERATOR") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const termId = new URL(request.url).searchParams.get("term");
  if (termId && !uuidPattern.test(termId)) return NextResponse.json({ error: "invalid_term" }, { status: 400 });
  const db = getDb();
  const term = termId ? (await db.select().from(terms).where(eq(terms.id, termId)).limit(1))[0] : await getActiveTerm(db);
  if (!term) return NextResponse.json({ error: "term_not_found" }, { status: 404 });

  const detail = await loadTermDetail(db, term.id);
  const q = detail.questions;
  const qHeader = q.map((_, index) => `문항${index + 1}`);
  const qWidths = q.map(() => 8);
  const scoreFormats = (start: number) => Object.fromEntries(Array.from({ length: q.length + 1 }, (_, i) => [start + i, "0.00"]));
  const averages = (values: Array<number | null> | null): Cell[] => (values ? values.map((value) => value) : q.map(() => null));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet(
    ["번호", "문항", "학기 평균"],
    q.map((question, index) => [index + 1, question, detail.overall.questionAverages[index]]),
    { 2: "0.00" }, [6, 60, 10],
  ), "문항");
  XLSX.utils.book_append_sheet(wb, sheet(
    ["강사", "담당 반", "유효 응답", "평가 대상", "참여율", "점수", ...qHeader, "비고"],
    detail.instructors.map((row) => [row.instructorName, row.classCodes.map((code) => `${code}반`).join(", "), row.responseCount, row.eligible, row.participationRate, row.score, ...averages(row.questionAverages), row.questionAverages ? "" : hidden]),
    { 4: "0.0%", ...scoreFormats(5) }, [12, 16, 9, 9, 8, 8, ...qWidths, 26],
  ), "강사별");
  XLSX.utils.book_append_sheet(wb, sheet(
    ["반", "강의실", "강사", "유효 응답", "평가 대상", "참여율", "점수", ...qHeader, "비고"],
    detail.classes.map((row) => [`${row.classCode}반`, row.room, row.instructorName, row.responseCount, row.eligible, row.participationRate, row.score, ...averages(row.questionAverages), row.questionAverages ? "" : hidden]),
    { 5: "0.0%", ...scoreFormats(6) }, [8, 10, 12, 9, 9, 8, 8, ...qWidths, 26],
  ), "반별");
  XLSX.utils.book_append_sheet(wb, sheet(
    ["반", "강사", ...qHeader, "응답 평균"],
    detail.anonymousRows.map((row) => {
      const valid = row.answers.filter((value): value is number => value !== null);
      return [`${row.classCode}반`, row.instructorName, ...row.answers, valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : null];
    }),
    { [q.length + 2]: "0.00" }, [8, 12, ...qWidths, 10],
  ), "응답별(익명)");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    [`${term.name} 강의평가 반별·문항별 상세`],
    [],
    ["· 학생 개인을 알아볼 수 있는 정보는 저장하지 않으므로 포함되지 않습니다."],
    [`· 응답이 ${DETAIL_MIN_RESPONSES}건 미만인 반·강사는 작성자가 드러나지 않도록 문항 점수를 비우고, 응답별 시트에서도 뺍니다.`],
    ["· 응답별 시트는 제출 순서가 드러나지 않도록 점수 순으로 정렬했습니다. 자유의견은 별도 '자유의견 내보내기'를 이용하세요."],
    ["· 점수는 평가 결과의 학기점수와 같은 방식(모든 문항 점수의 평균)으로 계산합니다."],
  ]), "안내");
  wb.SheetNames = ["안내", ...wb.SheetNames.filter((name) => name !== "안내")];

  const buffer: Buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx", compression: true });
  const filename = encodeURIComponent(`${term.name}_강의평가_반별문항별상세.xlsx`);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": `attachment; filename="lecture-evaluation-detail.xlsx"; filename*=UTF-8''${filename}`,
      "cache-control": "no-store",
    },
  });
}
