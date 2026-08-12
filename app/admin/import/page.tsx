import { AdminShell } from "@/components/admin-shell";
import { ImportPanel } from "@/components/import-panel";
export default function ImportPage(){return <AdminShell active="/admin/import" title="엑셀 가져오기"><div className="content"><div className="page-head"><div><h1>평가 일정 가져오기</h1><p>파일을 먼저 검증하고 미리보기에서 반·강의실·강사 배정을 확인합니다.</p></div><a href="/강의평가.xlsx" className="btn btn-secondary" download>기존 양식 다운로드</a></div><section className="card" style={{padding:24,maxWidth:960}}><ImportPanel/></section></div></AdminShell>}
