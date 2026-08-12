import { AdminShell } from "@/components/admin-shell";
import { AdminUsersPanel } from "@/components/admin-users-panel";

export default function UsersPage() {
  return <AdminShell active="/admin/users" title="관리자 관리"><div className="content"><div className="page-head"><div><h1>관리자 관리</h1><p>Google Workspace 계정과 관리자 역할을 관리합니다.</p></div></div><AdminUsersPanel /></div></AdminShell>;
}
