import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { TermsPanel } from "@/components/terms-panel";
import { requireSystemAdmin } from "@/lib/admin-access";

export default async function TermsPage() {
  if (!await requireSystemAdmin()) redirect("/admin");
  return <AdminShell active="/admin/terms" title="학기 관리"><div className="content">
    <div className="page-head"><div><h1>학기 관리</h1><p>운영 학기를 정하면 일정 가져오기, 현장 평가, 운영 현황이 그 학기 기준으로 동작합니다.</p></div></div>
    <TermsPanel />
  </div></AdminShell>;
}
