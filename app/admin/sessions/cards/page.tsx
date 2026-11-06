import { redirect } from "next/navigation";
import { QrCardSheet } from "@/components/qr-card-sheet";
import { getAdminSession } from "@/lib/auth";

// 인쇄 전용 화면이라 관리자 메뉴 없이 카드만 보여 준다.
export default async function QrCardsPage() {
  if (!await getAdminSession()) redirect("/login?returnTo=%2Fadmin%2Fsessions%2Fcards");
  return <QrCardSheet />;
}
