"use client";

import { useEffect, useState } from "react";
import { CalendarRange, CheckCircle2, Plus } from "lucide-react";

type TermRow = { id: string; code: string; name: string; startsAt: string; endsAt: string; active: boolean; classCount: number };

const dateFormatter = new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" });
const formatDate = (value: string) => dateFormatter.format(new Date(value));

export function TermsPanel() {
  const [rows, setRows] = useState<TermRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({ code: "2026-FALL", name: "2026년 가을학기", startsOn: "2026-09-01", endsOn: "2026-11-30", activate: true });

  async function apply(response: Response, success: string) {
    const data = await response.json().catch(() => ({})) as { terms?: TermRow[]; error?: string };
    if (!response.ok || !data.terms) throw new Error(data.error && data.error !== "database_unavailable" ? data.error : "학기 정보를 저장하지 못했습니다.");
    setRows(data.terms); setNotice(success);
  }

  useEffect(() => {
    fetch("/api/admin/terms", { cache: "no-store" })
      .then((response) => apply(response, ""))
      .catch(() => setError("학기 목록을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setError(""); setNotice("");
    try {
      await apply(await fetch("/api/admin/terms", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(form) }), form.activate ? `${form.name}을(를) 만들고 운영 학기로 지정했습니다.` : `${form.name}을(를) 만들었습니다.`);
    } catch (createError) { setError(createError instanceof Error ? createError.message : "학기를 만들지 못했습니다."); }
    finally { setBusy(false); }
  }

  async function activate(term: TermRow) {
    if (!confirm(`${term.name}을(를) 운영 학기로 전환할까요?\n일정 가져오기와 현장 평가가 이 학기 기준으로 바뀝니다. 다른 학기 데이터는 그대로 보관됩니다.`)) return;
    setBusy(true); setError(""); setNotice("");
    try { await apply(await fetch("/api/admin/terms", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: term.id }) }), `${term.name}을(를) 운영 학기로 전환했습니다.`); }
    catch (activateError) { setError(activateError instanceof Error ? activateError.message : "학기를 전환하지 못했습니다."); }
    finally { setBusy(false); }
  }

  return <div className="terms-layout">
    {error && <div className="error" role="alert">{error}</div>}
    {notice && <div className="terms-notice" role="status"><CheckCircle2 size={15} />{notice}</div>}
    <section className="card table-card">
      <div className="panel-head"><h2>학기 목록</h2><span>{rows.length}개</span></div>
      <table className="data-table"><thead><tr><th>학기</th><th>코드</th><th>기간</th><th>평가 반</th><th>상태</th><th></th></tr></thead><tbody>
        {rows.map((term) => <tr key={term.id}><td><strong>{term.name}</strong></td><td>{term.code}</td><td>{formatDate(term.startsAt)} – {formatDate(term.endsAt)}</td><td>{term.classCount}개</td><td>{term.active ? <span className="status NORMAL">운영 중</span> : <span className="status INSUFFICIENT">보관</span>}</td><td>{!term.active && <button className="btn btn-secondary" type="button" disabled={busy} onClick={() => activate(term)}>운영 학기로 전환</button>}</td></tr>)}
        {!loading && rows.length === 0 && <tr><td colSpan={6} className="session-empty-filter">등록된 학기가 없습니다.</td></tr>}
        {loading && <tr><td colSpan={6} className="session-empty-filter">불러오는 중…</td></tr>}
      </tbody></table>
    </section>
    <form className="card terms-form" onSubmit={create}>
      <div className="terms-form-head"><CalendarRange size={20} color="#0d3168" /><h2>새 학기 만들기</h2></div>
      <div className="terms-form-grid">
        <label className="field"><span>학기 이름</span><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required maxLength={40} /></label>
        <label className="field"><span>학기 코드</span><input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} required pattern="[A-Za-z0-9-]{3,30}" /></label>
        <label className="field"><span>시작일</span><input type="date" value={form.startsOn} onChange={(event) => setForm({ ...form, startsOn: event.target.value })} required /></label>
        <label className="field"><span>종료일</span><input type="date" value={form.endsOn} onChange={(event) => setForm({ ...form, endsOn: event.target.value })} required /></label>
      </div>
      <label className="notice-check"><input type="checkbox" checked={form.activate} onChange={(event) => setForm({ ...form, activate: event.target.checked })} />만든 뒤 바로 운영 학기로 지정</label>
      <p className="terms-help">설문은 현재 강의 평가서(8문항)로 연결합니다. 진행 중인 현장 평가가 있으면 학기를 전환할 수 없습니다.</p>
      <button className="btn btn-primary" type="submit" disabled={busy}><Plus size={15} />학기 만들기</button>
    </form>
  </div>;
}
