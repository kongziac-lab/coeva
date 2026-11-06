import { redirect } from "next/navigation";
import { RoundPanel } from "@/components/round-panel";
import { getAdminSession } from "@/lib/auth";
import { loadSessionClasses, SessionClass } from "@/lib/session-classes";

// 휴대폰 전용 순회 화면이라 관리자 메뉴 없이 반 목록만 크게 보여 준다.
export default async function RoundPage() {
  if (!await getAdminSession()) redirect("/login?returnTo=%2Fadmin%2Fsessions%2Fround");
  let sessionClasses: SessionClass[] = [];
  let termName: string | null = null;
  try { ({ termName, classes: sessionClasses } = await loadSessionClasses()); } catch { /* Show empty state. */ }
  if (!sessionClasses.length) return <main className="round-page"><p className="round-empty">{termName ? `${termName}에 등록된 평가 분반이 없습니다.` : "운영 학기가 없습니다."}</p></main>;
  return <RoundPanel classes={sessionClasses} termName={termName} />;
}
