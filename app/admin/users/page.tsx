import { AdminShell } from "@/components/admin-shell";

export default function UsersPage() {
  return <AdminShell active="/admin/users" title="관리자 관리"><div className="content"><div className="page-head"><div><h1>관리자 관리</h1><p>운영 담당자의 계정과 역할을 관리합니다.</p></div><button className="btn btn-primary">관리자 추가</button></div><section className="card table-card"><table className="data-table"><thead><tr><th>이름</th><th>이메일</th><th>역할</th><th>상태</th><th>최근 접속</th></tr></thead><tbody><tr><td><strong>김관리</strong></td><td>admin@kmu.ac.kr</td><td>시스템 관리자</td><td><span className="status NORMAL">활성</span></td><td>오늘 09:12</td></tr><tr><td><strong>이운영</strong></td><td>operator@kmu.ac.kr</td><td>현장 운영요원</td><td><span className="status NORMAL">활성</span></td><td>오늘 09:41</td></tr><tr><td><strong>박결과</strong></td><td>results@kmu.ac.kr</td><td>결과 관리자</td><td><span className="status NORMAL">활성</span></td><td>어제 16:20</td></tr></tbody></table></section></div></AdminShell>;
}
