import Link from "next/link";
import { ArrowLeft, Download, MessageSquareText } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { listTermComments, type TermComment } from "@/lib/comments";
import { getDb } from "@/lib/db";
import { languageNamesKo, locales, type Locale } from "@/lib/i18n";
import { listTerms } from "@/lib/terms";

const uuidPattern = /^[0-9a-f-]{36}$/i;
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
const languageLabel = (code: string) => (locales.includes(code as Locale) ? languageNamesKo[code as Locale] : code);
// 제출 시각까지 보이면 참여 기록과 맞춰 볼 수 있으므로 날짜만 보여 준다.
const dateLabel = (date: Date) => date.toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" });

export default async function CommentsPage({ searchParams }: { searchParams: Promise<{ term?: string | string[]; instructor?: string | string[] }> }) {
  const params = await searchParams;
  const requestedTerm = first(params.term);
  const requestedInstructor = first(params.instructor);
  let termOptions: Array<{ id: string; name: string; active: boolean }> = [];
  let selected: { id: string; name: string } | null = null;
  let allComments: TermComment[] = [];
  try {
    const db = getDb();
    termOptions = (await listTerms(db)).map((term) => ({ id: term.id, name: term.name, active: term.active }));
    selected = termOptions.find((term) => term.id === requestedTerm) ?? termOptions.find((term) => term.active) ?? termOptions[0] ?? null;
    if (selected) allComments = await listTermComments(db, selected.id);
  } catch { /* Show empty state. */ }

  const instructorOptions = [...new Map(allComments.map((row) => [row.instructorId, row.instructorName])).entries()].map(([id, name]) => ({ id, name, count: allComments.filter((row) => row.instructorId === id).length }));
  const instructorId = requestedInstructor && uuidPattern.test(requestedInstructor) && instructorOptions.some((item) => item.id === requestedInstructor) ? requestedInstructor : undefined;
  const comments = instructorId ? allComments.filter((row) => row.instructorId === instructorId) : allComments;
  const groups = new Map<string, { name: string; rows: TermComment[] }>();
  for (const row of comments) {
    const group = groups.get(row.instructorId) ?? { name: row.instructorName, rows: [] };
    group.rows.push(row);
    groups.set(row.instructorId, group);
  }

  const termQuery = selected ? `term=${encodeURIComponent(selected.id)}` : "";
  const exportHref = `/api/admin/export/comments?${[termQuery, instructorId ? `instructor=${instructorId}` : ""].filter(Boolean).join("&")}`;
  const resultsHref = selected ? `/admin/results?${termQuery}` : "/admin/results";

  return <AdminShell active="/admin/results" title="자유의견"><div className="content">
    <div className="page-head"><div><h1>강사별 자유의견</h1><p>{selected ? `${selected.name} · ` : ""}학생이 설문 마지막 칸에 남긴 의견을 원문 그대로 보여 줍니다.</p></div><div className="page-head-actions"><Link href={resultsHref} className="btn btn-secondary"><ArrowLeft size={16} />평가 결과</Link><a href={exportHref} className="btn btn-secondary"><Download size={16} />자유의견 내보내기</a></div></div>
    {termOptions.length > 1 && <nav className="results-term-tabs" aria-label="학기 선택">{termOptions.map((term) => <Link key={term.id} href={`/admin/results/comments?term=${term.id}`} className={`filter-button ${term.id === selected?.id ? "active" : ""}`} aria-current={term.id === selected?.id ? "page" : undefined}>{term.name}{term.active && <span>운영 중</span>}</Link>)}</nav>}
    {instructorOptions.length > 0 && <form className="comment-filter" method="get" action="/admin/results/comments">
      {selected && <input type="hidden" name="term" value={selected.id} />}
      <label htmlFor="comment-instructor">강사</label>
      <select id="comment-instructor" name="instructor" defaultValue={instructorId ?? ""}>
        <option value="">전체 ({allComments.length}건)</option>
        {instructorOptions.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.count}건)</option>)}
      </select>
      <button className="btn btn-secondary" type="submit">보기</button>
    </form>}
    <div style={{background:'#eef3fb',border:'1px solid #dce8fb',borderRadius:12,padding:'13px 16px',fontSize:12,color:'#1d4a8f',marginBottom:18,lineHeight:1.6}}>응답은 익명입니다. 수강생이 적은 반은 반·날짜만으로도 작성자가 짐작될 수 있으니, 강사에게 전달할 때는 원문 대신 요약을 권합니다.</div>
    {groups.size === 0 ? <section className="card empty-state"><MessageSquareText size={28} /><h2>자유의견이 없습니다</h2><p>{selected ? `${selected.name}에 제출된 자유의견이 없습니다.` : "등록된 학기가 없습니다."}</p></section>
      : [...groups.entries()].map(([id, group]) => <section key={id} className="card comment-group">
        <header><h2>{group.name}</h2><span>{group.rows.length}건</span></header>
        <ul>{group.rows.map((row) => <li key={row.id}><p lang={row.language}>{row.comment}</p><div className="comment-meta">{row.classCode}반 · {languageLabel(row.language)} · {dateLabel(row.submittedAt)}</div></li>)}</ul>
      </section>)}
  </div></AdminShell>;
}
