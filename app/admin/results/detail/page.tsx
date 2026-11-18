import Link from "next/link";
import { ArrowLeft, Download, Info } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { getDb } from "@/lib/db";
import { DETAIL_MIN_RESPONSES, loadTermDetail, type ScoreSummary, type TermDetail } from "@/lib/results-detail";
import { listTerms } from "@/lib/terms";

const uuidPattern = /^[0-9a-f-]{36}$/i;
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
const score = (value: number | null | undefined) => (value === null || value === undefined ? "-" : value.toFixed(2));
const percent = (value: number) => `${(value * 100).toFixed(1)}%`;
// 평가 결과 판정 기준(4.0)에 못 미치는 문항 평균을 눈에 띄게 표시한다.
const lowClass = (value: number | null | undefined) => (value !== null && value !== undefined && value < 4 ? "detail-low" : undefined);

function QuestionCells({ row, count }: { row: ScoreSummary; count: number }) {
  if (!row.questionAverages) return <td colSpan={count} className="detail-hidden">응답 {DETAIL_MIN_RESPONSES}건 미만 · 비공개</td>;
  return <>{row.questionAverages.map((value, index) => <td key={index} className={`detail-num ${lowClass(value) ?? ""}`}>{score(value)}</td>)}</>;
}

export default async function ResultsDetailPage({ searchParams }: { searchParams: Promise<{ term?: string | string[]; view?: string | string[]; instructor?: string | string[] }> }) {
  const params = await searchParams;
  const view = first(params.view) === "class" ? "class" : "instructor";
  const requestedTerm = first(params.term);
  const requestedInstructor = first(params.instructor);
  let termOptions: Array<{ id: string; name: string; active: boolean }> = [];
  let selected: { id: string; name: string } | null = null;
  let detail: TermDetail | null = null;
  try {
    const db = getDb();
    termOptions = (await listTerms(db)).map((term) => ({ id: term.id, name: term.name, active: term.active }));
    selected = termOptions.find((term) => term.id === requestedTerm) ?? termOptions.find((term) => term.active) ?? termOptions[0] ?? null;
    if (selected) detail = await loadTermDetail(db, selected.id);
  } catch { /* Show empty state. */ }

  const questions = detail?.questions ?? [];
  const instructorId = requestedInstructor && uuidPattern.test(requestedInstructor) && detail?.instructors.some((row) => row.instructorId === requestedInstructor) ? requestedInstructor : undefined;
  const classRows = (detail?.classes ?? []).filter((row) => !instructorId || row.instructorId === instructorId);
  const termQuery = selected ? `term=${encodeURIComponent(selected.id)}` : "";
  const href = (next: { view?: string; instructor?: string }) => `/admin/results/detail?${[termQuery, `view=${next.view ?? view}`, next.instructor ? `instructor=${next.instructor}` : ""].filter(Boolean).join("&")}`;
  const exportHref = `/api/admin/export/detail${termQuery ? `?${termQuery}` : ""}`;
  const resultsHref = selected ? `/admin/results?${termQuery}` : "/admin/results";
  const lowest = detail ? Math.min(...detail.overall.questionAverages.filter((value): value is number => value !== null)) : null;

  return <AdminShell active="/admin/results" title="반별·문항별 상세"><div className="content">
    <div className="page-head"><div><h1>반별·문항별 상세</h1><p>{selected ? `${selected.name} · ` : ""}익명 응답을 반·강사·문항별로 나눠 본 평균입니다.</p></div><div className="page-head-actions"><Link href={resultsHref} className="btn btn-secondary"><ArrowLeft size={16} />평가 결과</Link><a href={exportHref} className="btn btn-secondary"><Download size={16} />엑셀 내보내기</a></div></div>
    {termOptions.length > 1 && <nav className="results-term-tabs" aria-label="학기 선택">{termOptions.map((term) => <Link key={term.id} href={`/admin/results/detail?term=${term.id}&view=${view}`} className={`filter-button ${term.id === selected?.id ? "active" : ""}`} aria-current={term.id === selected?.id ? "page" : undefined}>{term.name}{term.active && <span>운영 중</span>}</Link>)}</nav>}
    <div className="detail-notice"><Info size={16} /><span>학생 개인별 응답은 저장하지 않으므로 볼 수 없습니다. 응답이 {DETAIL_MIN_RESPONSES}건 미만인 반·강사는 작성자가 드러나지 않도록 문항 점수를 가립니다. 4.0 미만인 평균은 붉게 표시합니다.</span></div>

    {!detail || detail.overall.responseCount === 0 ? <section className="card empty-state"><h2>집계할 응답이 없습니다</h2><p>{selected ? `${selected.name}에 제출된 평가 응답이 없습니다.` : "등록된 학기가 없습니다."}</p></section> : <>
      <section className="card table-card detail-section">
        <header className="detail-section-head"><h2>문항별 학기 평균</h2><span>응답 {detail.overall.responseCount.toLocaleString("ko-KR")}건</span></header>
        <table className="data-table"><thead><tr><th style={{ width: 64 }}>번호</th><th>문항</th><th style={{ width: 110 }}>평균</th></tr></thead><tbody>
          {questions.map((question, index) => { const value = detail!.overall.questionAverages[index]; return <tr key={index}><td>{index + 1}</td><td>{question}{value === lowest && <span className="detail-tag">가장 낮음</span>}</td><td className={`detail-num ${lowClass(value) ?? ""}`}>{score(value)}</td></tr>; })}
        </tbody></table>
      </section>

      <nav className="results-term-tabs detail-view-tabs" aria-label="보기 선택">
        <Link href={href({ view: "instructor" })} className={`filter-button ${view === "instructor" ? "active" : ""}`} aria-current={view === "instructor" ? "page" : undefined}>강사별</Link>
        <Link href={href({ view: "class", instructor: instructorId })} className={`filter-button ${view === "class" ? "active" : ""}`} aria-current={view === "class" ? "page" : undefined}>반별</Link>
      </nav>

      {view === "instructor" ? <section className="card table-card">
        <table className="data-table detail-table"><thead><tr><th>강사</th><th>담당 반</th><th>응답</th><th>참여율</th><th>점수</th>{questions.map((question, index) => <th key={index} className="detail-num" title={question}>{index + 1}</th>)}</tr></thead><tbody>
          {detail.instructors.map((row) => <tr key={row.instructorId}><td><Link className="comment-count-link" href={href({ view: "class", instructor: row.instructorId })}>{row.instructorName}</Link></td><td>{row.classCodes.map((code) => `${code}반`).join(", ")}</td><td>{row.responseCount} / {row.eligible}</td><td>{percent(row.participationRate)}</td><td className={`detail-num ${lowClass(row.score) ?? ""}`}><strong>{score(row.score)}</strong></td><QuestionCells row={row} count={questions.length} /></tr>)}
        </tbody></table>
      </section> : <>
        <form className="comment-filter" method="get" action="/admin/results/detail">
          {selected && <input type="hidden" name="term" value={selected.id} />}
          <input type="hidden" name="view" value="class" />
          <label htmlFor="detail-instructor">강사</label>
          <select id="detail-instructor" name="instructor" defaultValue={instructorId ?? ""}>
            <option value="">전체 ({detail.classes.length}개 반·강사)</option>
            {detail.instructors.map((row) => <option key={row.instructorId} value={row.instructorId}>{row.instructorName} ({row.classCodes.length}개 반)</option>)}
          </select>
          <button className="btn btn-secondary" type="submit">보기</button>
        </form>
        <section className="card table-card">
          <table className="data-table detail-table"><thead><tr><th>반</th><th>강의실</th><th>강사</th><th>응답</th><th>참여율</th><th>점수</th>{questions.map((question, index) => <th key={index} className="detail-num" title={question}>{index + 1}</th>)}</tr></thead><tbody>
            {classRows.map((row) => <tr key={row.assignmentId}><td><strong>{row.classCode}반</strong></td><td>{row.room}</td><td>{row.instructorName}</td><td>{row.responseCount} / {row.eligible}</td><td>{percent(row.participationRate)}</td><td className={`detail-num ${lowClass(row.score) ?? ""}`}><strong>{score(row.score)}</strong></td><QuestionCells row={row} count={questions.length} /></tr>)}
          </tbody></table>
        </section>
      </>}
      <p className="detail-footnote">열 번호는 위 「문항별 학기 평균」의 문항 번호입니다. 점수는 평가 결과 화면의 학기점수와 같은 방식(모든 문항 점수의 평균)으로 계산합니다.</p>
    </>}
  </div></AdminShell>;
}
