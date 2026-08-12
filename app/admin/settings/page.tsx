import { AdminShell } from "@/components/admin-shell";

export default function SettingsPage() {
  return <AdminShell active="/admin/settings" title="환경 설정"><div className="content"><div className="page-head"><div><h1>환경 설정</h1><p>현장 평가 운영과 데이터 보존 정책을 설정합니다.</p></div><button className="btn btn-primary">변경사항 저장</button></div><section className="card" style={{ padding: 24, maxWidth: 780 }}><div className="field"><label>QR 기본 유효시간(분)</label><input defaultValue="10" type="number" min="1" max="30" /></div><div className="field"><label>판정 최소 참여율(%)</label><input defaultValue="50" type="number" min="1" max="100" /></div><div className="field"><label>자유의견 보존기간(일)</label><input defaultValue="730" type="number" min="30" /></div><div style={{ marginTop: 20, padding: 15, borderRadius: 12, background: "#eaf2ff", color: "#24558d", fontSize: 13, lineHeight: 1.6 }}>학생 식별 정보와 익명 응답은 분리 저장됩니다. KGAS 연동 전에는 참여 인원 집계만 제공됩니다.</div></section></div></AdminShell>;
}
