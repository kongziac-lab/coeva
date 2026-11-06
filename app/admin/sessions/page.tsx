import Link from "next/link";
import { Footprints, Printer } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { SessionOperatorPanel } from "@/components/session-operator-panel";
import { loadSessionClasses, SessionClass } from "@/lib/session-classes";

export default async function SessionsPage() {
  let sessionClasses: SessionClass[] = [];
  let termName: string | null = null;
  try { ({ termName, classes: sessionClasses } = await loadSessionClasses()); } catch { /* Show empty state. */ }
  return <AdminShell active="/admin/sessions" title="현장 평가"><div className="content">
    <div className="page-head"><div><h1>현장 평가 운영</h1><p>{termName ? `${termName} · ` : ""}조사할 반을 선택하고 대상 인원을 입력한 뒤 QR을 생성하세요. QR은 15분 뒤 자동으로 마감됩니다.</p></div>{sessionClasses.length > 0 && <div className="page-head-actions"><Link href="/admin/sessions/cards" className="btn btn-secondary"><Printer size={16} />QR 카드 인쇄·저장</Link><Link href="/admin/sessions/round" className="btn btn-primary"><Footprints size={16} />순회 모드</Link></div>}</div>
    {sessionClasses.length > 0 ? <SessionOperatorPanel classes={sessionClasses} /> : <section className="card" style={{ padding: 36, textAlign: "center", color: "#5b6b84" }}>{termName ? `${termName}에 등록된 평가 일정이 없습니다. 시스템 관리자가 먼저 엑셀 일정을 가져와야 합니다.` : "운영 학기가 없습니다. 시스템 관리자가 학기 관리에서 먼저 학기를 만들어야 합니다."}</section>}
  </div></AdminShell>;
}
