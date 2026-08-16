"use client";

import { useEffect, useState } from "react";
import { KeyRound, Pencil, Plus, Shield, Trash2, UserRound } from "lucide-react";

type Admin = { id: string; email: string; name: string; role: "SYSTEM_ADMIN" | "SURVEY_OPERATOR" | "RESULTS_ADMIN"; active: boolean; totpEnabled: boolean; googleSubject: boolean; lastLoginAt: string | null; createdAt: string };
const roleLabel = { SYSTEM_ADMIN: "시스템 관리자", SURVEY_OPERATOR: "현장 운영요원", RESULTS_ADMIN: "결과 관리자" };

export function AdminUsersPanel() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [me, setMe] = useState<{ email: string } | null>(null);
  const [editing, setEditing] = useState<Admin | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: "", name: "", role: "SURVEY_OPERATOR" as Admin["role"] });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [totpAdmin, setTotpAdmin] = useState<Admin | null>(null);
  const [totpQr, setTotpQr] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [totpLoading, setTotpLoading] = useState(false);

  async function load() {
    setLoading(true);
    const response = await fetch("/api/admin/users", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) setError(data.error ?? "관리자 목록을 불러오지 못했습니다.");
    else { setAdmins(data.admins); setMe(data.me); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openCreate() { setEditing(null); setShowForm(true); setForm({ email: "", name: "", role: "SURVEY_OPERATOR" }); setError(""); }
  function openEdit(admin: Admin) { setEditing(admin); setShowForm(true); setForm({ email: admin.email, name: admin.name, role: admin.role }); setError(""); }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const response = await fetch(editing ? `/api/admin/users/${editing.id}` : "/api/admin/users", { method: editing ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(editing ? { name: form.name, role: form.role } : form) });
    const data = await response.json();
    if (!response.ok) { setError(data.error ?? "저장하지 못했습니다."); return; }
    setEditing(null); setShowForm(false); await load();
  }

  async function remove(admin: Admin) {
    if (!window.confirm(`${admin.name} 관리자를 삭제할까요?`)) return;
    const response = await fetch(`/api/admin/users/${admin.id}`, { method: "DELETE" });
    if (!response.ok) { const data = await response.json(); setError(data.error ?? "삭제하지 못했습니다."); return; }
    await load();
  }

  async function openTotp(admin: Admin) {
    setTotpAdmin(admin);
    setTotpCode("");
    setError("");
    setTotpQr(null);
    const response = await fetch("/api/auth/setup-totp", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) { setError(data.error ?? "2FA 설정을 시작하지 못했습니다."); setTotpAdmin(null); return; }
    setTotpQr(data.qr);
  }

  async function verifyTotp(event: React.FormEvent) {
    event.preventDefault();
    setTotpLoading(true);
    setError("");
    const response = await fetch("/api/auth/setup-totp", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code: totpCode }) });
    if (!response.ok) { setError("인증 코드가 올바르지 않습니다."); setTotpLoading(false); return; }
    setTotpAdmin(null); setTotpQr(null); setTotpCode(""); setTotpLoading(false); await load();
  }

  async function resetTotp(admin: Admin) {
    if (!window.confirm(`${admin.name} 관리자의 2FA를 초기화할까요? 다음 로그인부터 다시 등록해야 합니다.`)) return;
    const response = await fetch(`/api/admin/users/${admin.id}/totp`, { method: "DELETE" });
    if (!response.ok) { const data = await response.json(); setError(data.error ?? "초기화하지 못했습니다."); return; }
    await load();
  }

  return <>
    <div className="admin-users-toolbar"><div className="admin-users-summary"><UserRound size={18} /><span>등록 관리자 <strong>{admins.length}명</strong></span></div><button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> 관리자 추가</button></div>
    {error && <div className="error" style={{ margin: "14px 0" }}>{error}</div>}
    <section className="card table-card"><table className="data-table"><thead><tr><th>이름</th><th>Google Workspace 이메일</th><th>역할</th><th>로그인</th><th>2FA 상태</th><th>상태</th><th>관리</th></tr></thead><tbody>{loading ? <tr><td colSpan={7}>불러오는 중…</td></tr> : admins.map((admin) => <tr key={admin.id}><td><strong>{admin.name}</strong></td><td>{admin.email}</td><td><span className="status INSUFFICIENT">{roleLabel[admin.role]}</span></td><td>{admin.googleSubject ? <span className="status NORMAL">Google 연결</span> : <span style={{ color: "#65758a" }}>첫 로그인 전</span>}</td><td>{admin.totpEnabled ? <span className="status NORMAL">사용 중</span> : <span style={{ color: "#65758a" }}>미등록</span>}</td><td><span className={`status ${admin.active ? "NORMAL" : "RESTRICTION"}`}>{admin.active ? "활성" : "삭제됨"}</span></td><td><div className="admin-row-actions"><button className="icon-button" onClick={() => openEdit(admin)} aria-label={`${admin.name} 수정`}><Pencil size={15} /></button>{admin.active && admin.email === me?.email && <button className="icon-button" onClick={() => openTotp(admin)} aria-label={`${admin.name} 2FA ${admin.totpEnabled ? "재등록" : "등록"}`} title={`2FA ${admin.totpEnabled ? "재등록" : "등록"}`}><Shield size={15} /></button>}{admin.active && admin.email !== me?.email && admin.totpEnabled && <button className="icon-button danger" onClick={() => resetTotp(admin)} aria-label={`${admin.name} 2FA 초기화`} title="2FA 초기화"><KeyRound size={15} /></button>}{admin.active && <button className="icon-button danger" onClick={() => remove(admin)} aria-label={`${admin.name} 삭제`}><Trash2 size={15} /></button>}</div></td></tr>)}</tbody></table></section>
    <div className={`admin-modal-backdrop ${showForm ? "open" : ""}`} onClick={() => { setEditing(null); setShowForm(false); }}><div className="admin-modal" onClick={(event) => event.stopPropagation()}><div className="panel-head"><h2>{editing ? "관리자 정보 수정" : "관리자 추가"}</h2><button className="icon-button" onClick={() => { setEditing(null); setShowForm(false); }} aria-label="닫기">×</button></div><form onSubmit={save} style={{ padding: "0 22px 22px" }}><div className="field"><label htmlFor="admin-email">Workspace 이메일</label><input id="admin-email" type="email" value={form.email} disabled={Boolean(editing)} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></div><div className="field"><label htmlFor="admin-name">이름</label><input id="admin-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></div><div className="field"><label htmlFor="admin-role">역할</label><select id="admin-role" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as Admin["role"] })}>{Object.entries(roleLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div><p className="admin-modal-help">추가된 관리자는 등록한 Google Workspace 계정으로 로그인할 수 있습니다.</p><button className="btn btn-primary" style={{ width: "100%" }}>{editing ? "변경사항 저장" : "관리자 추가"}</button></form></div></div>
    {totpAdmin && <div className="admin-modal-backdrop open" onClick={() => { setTotpAdmin(null); setTotpQr(null); setTotpCode(""); }}><div className="admin-modal" onClick={(event) => event.stopPropagation()}><div className="panel-head"><h2>Google Authenticator 등록</h2><button className="icon-button" onClick={() => { setTotpAdmin(null); setTotpQr(null); setTotpCode(""); }} aria-label="닫기">×</button></div><div style={{ padding: "0 22px 22px" }}>{totpQr ? <><div style={{ textAlign: "center", marginBottom: 16 }}><img src={totpQr} alt="Google Authenticator QR 코드" style={{ width: 200, height: 200, borderRadius: 12 }} /></div><p className="admin-modal-help">Google Authenticator 앱에서 QR 코드를 스캔한 뒤 아래에 표시된 6자리 코드를 입력하세요.</p><form onSubmit={verifyTotp}><div className="field"><label htmlFor="totp-verify-code">인증 코드</label><input id="totp-verify-code" type="text" inputMode="numeric" pattern="\\d{6}" maxLength={6} value={totpCode} onChange={(event) => setTotpCode(event.target.value.replace(/\\D/g, ""))} required /></div>{error && <div className="error" style={{ marginBottom: 12 }}>{error}</div>}<button className="btn btn-primary" style={{ width: "100%" }} disabled={totpLoading || totpCode.length !== 6}>{totpLoading ? "확인 중…" : "활성화"}</button></form></> : <div style={{ padding: 24, textAlign: "center" }}>QR 코드를 불러오는 중…</div>}</div></div></div>}
  </>;
}
