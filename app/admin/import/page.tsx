import { AdminShell } from "@/components/admin-shell";
import { ImportPanel } from "@/components/import-panel";
import { getActiveTerm } from "@/lib/terms";

export default async function ImportPage() {
  let termName: string | null = null;
  try { termName = (await getActiveTerm())?.name ?? null; } catch { /* Show the no-term notice. */ }
  return <AdminShell active="/admin/import" title="엑셀 가져오기"><div className="content"><div className="page-head"><div><h1>평가 일정 가져오기</h1><p>파일을 먼저 검증하고 미리보기에서 반·강의실·강사 배정을 확인합니다.</p></div><a href="/강의평가_양식.xlsx" className="btn btn-secondary" download>강의평가 양식 다운로드</a></div><section className="card" style={{padding:24,maxWidth:960}}>{termName ? <ImportPanel termName={termName}/> : <div className="error">운영 학기가 없습니다. <a className="link" href="/admin/terms">학기 관리</a>에서 먼저 학기를 만들어 주세요.</div>}</section></div></AdminShell>;
}
