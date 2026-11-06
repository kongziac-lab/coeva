import Link from "next/link";
import { Download, Info } from "lucide-react";
import { desc, eq } from "drizzle-orm";
import { AdminShell } from "@/components/admin-shell";
import { instructors, termResults } from "@/db/schema";
import { getDb } from "@/lib/db";
import { listTerms } from "@/lib/terms";

const statusName = { NORMAL:"정상", WARNING:"1차 경고", RESTRICTION:"강의 제한", INSUFFICIENT:"판정보류" } as const;
type Row = { name:string; rawScore:number|null; responseCount:number; eligibleOpportunities:number; participationRate:number; status:keyof typeof statusName; reason:string };

export default async function ResultsPage({ searchParams }: { searchParams: Promise<{ term?: string | string[] }> }) {
  const requested = (await searchParams).term;
  const requestedId = Array.isArray(requested) ? requested[0] : requested;
  let rows: Row[] = [];
  let termOptions: Array<{ id: string; name: string; active: boolean }> = [];
  let selected: { id: string; name: string } | null = null;
  try {
    const db = getDb();
    termOptions = (await listTerms(db)).map((term) => ({ id: term.id, name: term.name, active: term.active }));
    selected = termOptions.find((term) => term.id === requestedId) ?? termOptions.find((term) => term.active) ?? termOptions[0] ?? null;
    if (selected) rows = await db.select({name:instructors.name,rawScore:termResults.rawScore,responseCount:termResults.responseCount,eligibleOpportunities:termResults.eligibleOpportunities,participationRate:termResults.participationRate,status:termResults.status,reason:termResults.reason}).from(termResults).innerJoin(instructors,eq(termResults.instructorId,instructors.id)).where(eq(termResults.termId, selected.id)).orderBy(desc(termResults.calculatedAt), instructors.name);
  } catch { /* Show empty state. */ }
  const exportHref = selected ? `/api/admin/export?term=${encodeURIComponent(selected.id)}` : "/api/admin/export";
  return <AdminShell active="/admin/results" title="평가 결과"><div className="content">
    <div className="page-head"><div><h1>강사별 평가 결과</h1><p>{selected ? `${selected.name} · ` : ""}실제 제출 응답을 집계한 결과만 표시합니다.</p></div><a href={exportHref} className="btn btn-secondary"><Download size={16}/>결과 내보내기</a></div>
    {termOptions.length > 1 && <nav className="results-term-tabs" aria-label="학기 선택">{termOptions.map((term) => <Link key={term.id} href={`/admin/results?term=${term.id}`} className={`filter-button ${term.id === selected?.id ? "active" : ""}`} aria-current={term.id === selected?.id ? "page" : undefined}>{term.name}{term.active && <span>운영 중</span>}</Link>)}</nav>}
    <div style={{background:'#eef3fb',border:'1px solid #dce8fb',borderRadius:12,padding:'13px 16px',fontSize:12,color:'#1d4a8f',display:'flex',gap:9,alignItems:'center',marginBottom:18}}><Info size={16}/>참여율 50% 미만인 결과는 판정을 보류합니다.</div>
    <section className="card table-card"><table className="data-table"><thead><tr><th>강사</th><th>유효 응답</th><th>참여율</th><th>점수</th><th>판정 상태</th><th>판정 근거</th></tr></thead><tbody>{rows.map((row,index)=><tr key={`${row.name}-${index}`}><td><strong>{row.name}</strong></td><td>{row.responseCount} / {row.eligibleOpportunities}</td><td>{(row.participationRate*100).toFixed(1)}%</td><td>{row.rawScore === null ? "-" : row.rawScore.toFixed(2)}</td><td><span className={`status ${row.status}`}>{statusName[row.status]}</span></td><td>{row.reason}</td></tr>)}{rows.length===0&&<tr><td colSpan={6} style={{textAlign:"center",padding:36,color:'#5b6b84'}}>{selected ? `${selected.name}에 집계된 평가 결과가 없습니다.` : "집계된 평가 결과가 없습니다."}</td></tr>}</tbody></table></section>
  </div></AdminShell>;
}
