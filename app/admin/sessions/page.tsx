import QRCode from "qrcode";
import { Play } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { SessionOperatorPanel, SessionClass } from "@/components/session-operator-panel";
import { liveClasses } from "@/lib/demo-data";

export default async function SessionsPage() {
  const appUrl = process.env.APP_URL ?? "https://coeva.vercel.app";
  const classes: SessionClass[] = await Promise.all(liveClasses.map(async (item, index) => ({ ...item, qr: await QRCode.toDataURL(`${appUrl}/survey/demo-134?class=${item.classCode}`, { width: 420, margin: 1, color: { dark: "#102b4e", light: "#ffffff" } }), surveyUrl: "/survey/demo-134" }))) as SessionClass[];
  return <AdminShell active="/admin/sessions" title="현장 평가"><div className="content"><div className="page-head"><div><h1>현장 평가 운영</h1><p>조사할 반을 선택한 뒤 임시 QR을 학생들에게 공유하세요.</p></div><button className="btn btn-primary"><Play size={16} /> 다음 반 시작</button></div><SessionOperatorPanel classes={classes} /></div></AdminShell>;
}
