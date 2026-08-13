import { Download, Info } from "lucide-react";
import { desc, eq } from "drizzle-orm";
import { AdminShell } from "@/components/admin-shell";
import { instructors, termResults, terms } from "@/db/schema";
import { getDb } from "@/lib/db";

const statusName = { NORMAL:"정상", WARNING:"1차 경고", RESTRICTION:"강의 제한", INSUFFICIENT:"판정 보류" } as const;
export default async function ResultsPage(){
  let rows: Array<{name:string;rawScore:number|null;responseCount:number;eligibleOpportunities:number;participationRate:number;status:keyof typeof statusName;reason:string;termName:string}> = [];
  try { rows = await getDb().select({name:instructors.name,rawScore:termResults.rawScore,responseCount:termResults.responseCount,eligibleOpportunities:termResults.eligibleOpportunities,participationRate:termResults.participationRate,status:termResults.status,reason:termResults.reason,termName:terms.name}).from(termResults).innerJoin(instructors,eq(termResults.instructorId,instructors.id)).innerJoin(terms,eq(termResults.termId,terms.id)).orderBy(desc(termResults.calculatedAt)); } catch { /* Show empty state. */ }
  return <AdminShell active="/admin/results" title="평가 결과"><div className="content"><div className="page-head"><div><h1>강사별 평가 결과</h1><p>실제 제출 응답을 집계한 결과만 표시합니다.</p></div><a href="/api/admin/export" className="btn btn-secondary"><Download size={16}/>결과 내보내기</a></div><div style={{background:'#eaf2ff',border:'1px solid #cfe0f8',borderRadius:12,padding:'13px 16px',fontSize:12,color:'#24558d',display:'flex',gap:9,alignItems:'center',marginBottom:18}}><Info size={16}/>참여율 50% 미만인 결과는 판정을 보류합니다.</div><section className="card table-card"><table className="data-table"><thead><tr><th>학기</th><th>강사</th><th>유효 응답</th><th>참여율</th><th>점수</th><th>판정 상태</th><th>판정 근거</th></tr></thead><tbody>{rows.map((row,index)=><tr key={`${row.name}-${index}`}><td>{row.termName}</td><td><strong>{row.name}</strong></td><td>{row.responseCount} / {row.eligibleOpportunities}</td><td>{(row.participationRate*100).toFixed(1)}%</td><td>{row.rawScore === null ? "-" : row.rawScore.toFixed(2)}</td><td><span className={`status ${row.status}`}>{statusName[row.status]}</span></td><td>{row.reason}</td></tr>)}{rows.length===0&&<tr><td colSpan={7} style={{textAlign:"center",padding:36,color:'#65758a'}}>집계된 평가 결과가 없습니다.</td></tr>}</tbody></table></section></div></AdminShell>;
}
