import { AdminShell } from "@/components/admin-shell";

export default function AuditPage() {
  return <AdminShell active="/admin/audit" title="감사 로그"><div className="content"><div className="page-head"><div><h1>감사 로그</h1><p>평가 세션, 데이터 가져오기, 결과 조회 이력을 확인합니다.</p></div><button className="btn btn-secondary">CSV 내보내기</button></div><section className="card table-card"><table className="data-table"><thead><tr><th>시간</th><th>사용자</th><th>작업</th><th>대상</th><th>상세</th></tr></thead><tbody><tr><td>오늘 09:41</td><td>이운영</td><td><span className="status NORMAL">세션 시작</span></td><td>1반 · 134호</td><td>대상 18명, 10분 세션</td></tr><tr><td>오늘 09:02</td><td>김관리</td><td><span className="status INSUFFICIENT">엑셀 가져오기</span></td><td>2026년 여름학기</td><td>76개 반</td></tr><tr><td>어제 17:33</td><td>박결과</td><td><span className="status NORMAL">결과 조회</span></td><td>2026년 여름학기</td><td>강사별 결과 화면</td></tr></tbody></table></section></div></AdminShell>;
}
