"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Clock3, ExternalLink, QrCode, Radio, RefreshCw, RotateCcw, Square, Timer, Users, X } from "lucide-react";
import QRCode from "qrcode";

export type SessionClass = {
  id: string;
  room: string;
  classCode: string;
  time: string;
  instructors: string[];
  target: number;
  connected: number;
  submitted: number;
  remaining: number;
  status: string;
  sessionId: string | null;
  url: string | null;
  expiresAt: string | null;
  reopenable: boolean;
};

type ActiveSession = { id: string; url: string; qr: string };
type StatusFilter = "ALL" | "READY" | "ACTIVE";
type SessionSnapshot = {
  classId: string;
  sessionId: string | null;
  status: "ACTIVE" | "READY";
  targetCount: number;
  connected: number;
  completed: number;
  remaining: number;
  url: string | null;
  expiresAt: string | null;
  reopenable: boolean;
  updatedAt?: string;
};

function initialSnapshots(classes: SessionClass[]) {
  return Object.fromEntries(classes.map((item) => [item.id, {
    classId: item.id,
    sessionId: item.sessionId,
    status: item.status === "ACTIVE" ? "ACTIVE" : "READY",
    targetCount: item.target,
    connected: item.connected,
    completed: item.submitted,
    remaining: item.remaining,
    url: item.url,
    expiresAt: item.expiresAt,
    reopenable: item.reopenable,
  }])) as Record<string, SessionSnapshot>;
}

function storageKey(classId: string) {
  return `coeva_active_session_${classId}`;
}

type RowState = "ACTIVE" | "READY" | "CLOSED";
const rowLabel: Record<RowState, string> = { ACTIVE: "진행 중", READY: "시작 대기", CLOSED: "마감" };
function rowState(snapshot: SessionSnapshot | null | undefined): RowState {
  if (snapshot?.status === "ACTIVE") return "ACTIVE";
  return snapshot?.sessionId ? "CLOSED" : "READY";
}
function formatRemaining(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function publicTokenFromUrl(url: string) {
  try { return decodeURIComponent(new URL(url).pathname.split("/").filter(Boolean).at(-1) ?? ""); }
  catch { return ""; }
}

export function SessionOperatorPanel({ classes }: { classes: SessionClass[] }) {
  const [selectedId, setSelectedId] = useState(classes[0]?.id ?? "");
  const [targets, setTargets] = useState<Record<string, number>>(Object.fromEntries(classes.map((item) => [item.id, item.target || 1])));
  const [snapshots, setSnapshots] = useState<Record<string, SessionSnapshot>>(() => initialSnapshots(classes));
  const [active, setActive] = useState<Record<string, ActiveSession>>({});
  const [zoom, setZoom] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [resetClassId, setResetClassId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const selected = classes.find((item) => item.id === selectedId) ?? classes[0];
  const selectedSnapshot = selected ? snapshots[selected.id] : null;
  const current = selected ? active[selected.id] : null;
  const isActive = selectedSnapshot?.status === "ACTIVE";
  const remainingMs = isActive && selectedSnapshot?.expiresAt ? new Date(selectedSnapshot.expiresAt).getTime() - now : null;
  const canReopen = !isActive && Boolean(selectedSnapshot?.reopenable && selectedSnapshot.sessionId);

  const displayClasses = useMemo(() => classes.map((item) => {
    const snapshot = snapshots[item.id];
    return {
      ...item,
      status: snapshot?.status ?? "READY",
      state: rowState(snapshot),
      target: snapshot?.targetCount ?? item.target,
      connected: snapshot?.connected ?? item.connected,
      submitted: snapshot?.completed ?? item.submitted,
      remaining: snapshot?.remaining ?? item.remaining,
    };
  }), [classes, snapshots]);
  const filteredClasses = statusFilter === "ALL" ? displayClasses : displayClasses.filter((item) => item.status === statusFilter);

  useEffect(() => {
    if (!isActive) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [isActive]);
  const resetTarget = classes.find((item) => item.id === resetClassId) ?? null;

  useEffect(() => {
    let cancelled = false;

    async function rememberQr(classId: string, sessionId: string, url: string) {
      const qr = await QRCode.toDataURL(url, { width: 420, margin: 1, color: { dark: "#0d3168", light: "#ffffff" } });
      if (cancelled) return;
      const session = { id: sessionId, url, qr };
      localStorage.setItem(storageKey(classId), JSON.stringify(session));
      setActive((previous) => previous[classId]?.id === sessionId && previous[classId]?.url === url ? previous : { ...previous, [classId]: session });
    }

    for (const item of classes) {
      const snapshot = snapshots[item.id];
      if (snapshot?.status !== "ACTIVE" || !snapshot.sessionId) continue;
      if (active[item.id]?.id === snapshot.sessionId) continue;
      if (snapshot.url) {
        void rememberQr(item.id, snapshot.sessionId, snapshot.url);
        continue;
      }
      try {
        const saved = JSON.parse(localStorage.getItem(storageKey(item.id)) ?? "null") as ActiveSession | null;
        if (!saved || saved.id !== snapshot.sessionId || !saved.url || !saved.qr) continue;
        setActive((previous) => ({ ...previous, [item.id]: saved }));
        const token = publicTokenFromUrl(saved.url);
        if (token) void fetch("/api/admin/sessions", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: saved.id, token }) });
      } catch {
        localStorage.removeItem(storageKey(item.id));
      }
    }
    return () => { cancelled = true; };
  }, [active, classes, snapshots]);

  useEffect(() => {
    let cancelled = false;
    async function refreshAll() {
      try {
        const response = await fetch("/api/admin/sessions", { cache: "no-store" });
        if (!response.ok) return;
        const result = await response.json() as { sessions: SessionSnapshot[] };
        if (cancelled) return;
        const serverByClass = Object.fromEntries(result.sessions.map((snapshot) => [snapshot.classId, snapshot]));
        setSnapshots((previous) => {
          const next = { ...previous };
          for (const item of classes) {
            const server = serverByClass[item.id];
            if (server) next[item.id] = server;
          }
          return next;
        });
        const closedClassIds = result.sessions.filter((snapshot) => snapshot.status === "READY").map((snapshot) => snapshot.classId);
        if (closedClassIds.length) {
          for (const classId of closedClassIds) localStorage.removeItem(storageKey(classId));
          setActive((previous) => {
            const next = { ...previous };
            for (const classId of closedClassIds) delete next[classId];
            return next;
          });
        }
      } catch { /* Keep the last known values and retry on the next interval. */ }
    }
    void refreshAll();
    const timer = window.setInterval(refreshAll, 3000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [classes]);

  if (!selected) return null;

  function chooseClass(id: string) {
    setSelectedId(id); setZoom(false); setError("");
    document.getElementById("session-detail")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function start() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/sessions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ classId: selected.id, targetCount: Math.max(1, targets[selected.id] || 1) }) });
      const result = await response.json() as { id?: string; classId?: string; url?: string; targetCount?: number; expiresAt?: string | null; error?: string };
      if (!response.ok || !result.id || !result.url) {
        if (result.error === "questionnaire_required") throw new Error("먼저 설문을 등록해 주세요.");
        if (result.error === "session_already_active") throw new Error("이미 진행 중인 평가가 있습니다. 잠시 후 상태가 갱신됩니다.");
        if (result.error === "class_not_in_active_term") throw new Error("운영 학기가 바뀌었습니다. 화면을 새로고침해 주세요.");
        throw new Error("평가 세션을 시작하지 못했습니다.");
      }
      const qr = await QRCode.toDataURL(result.url, { width: 420, margin: 1, color: { dark: "#0d3168", light: "#ffffff" } });
      const session = { id: result.id, url: result.url, qr };
      localStorage.setItem(storageKey(selected.id), JSON.stringify(session));
      setActive((previous) => ({ ...previous, [selected.id]: session }));
      setSnapshots((previous) => ({ ...previous, [selected.id]: { classId: selected.id, sessionId: result.id!, status: "ACTIVE", targetCount: result.targetCount ?? targets[selected.id] ?? 1, connected: 0, completed: 0, remaining: result.targetCount ?? targets[selected.id] ?? 1, url: result.url!, expiresAt: result.expiresAt ?? null, reopenable: false } }));
      setNow(Date.now());
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : "평가 세션을 시작하지 못했습니다.");
    } finally { setBusy(false); }
  }

  async function stop() {
    const id = current?.id ?? selectedSnapshot?.sessionId;
    if (!id) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/admin/sessions?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!response.ok) throw new Error();
      localStorage.removeItem(storageKey(selected.id));
      setActive((previous) => { const next = { ...previous }; delete next[selected.id]; return next; });
      setSnapshots((previous) => ({ ...previous, [selected.id]: { ...previous[selected.id], sessionId: id, status: "READY", connected: 0, url: null, expiresAt: null, reopenable: true } }));
      setZoom(false);
    } catch { setError("평가 세션을 종료하지 못했습니다."); }
    finally { setBusy(false); }
  }

  async function reopen() {
    const id = selectedSnapshot?.sessionId;
    if (!id) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/sessions/reopen", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) });
      const result = await response.json() as { id?: string; url?: string; expiresAt?: string | null; error?: string };
      if (!response.ok || !result.id || !result.url) {
        if (result.error === "session_already_active") throw new Error("이미 진행 중인 평가가 있습니다. 잠시 후 상태가 갱신됩니다.");
        if (result.error === "qr_not_restorable") throw new Error("이 평가는 QR 정보가 남아 있지 않아 다시 열 수 없습니다. 새 QR로 시작해 주세요.");
        if (result.error === "class_not_in_active_term") throw new Error("운영 학기가 바뀌었습니다. 화면을 새로고침해 주세요.");
        throw new Error("평가를 다시 열지 못했습니다.");
      }
      const qr = await QRCode.toDataURL(result.url, { width: 420, margin: 1, color: { dark: "#0d3168", light: "#ffffff" } });
      const session = { id: result.id, url: result.url, qr };
      localStorage.setItem(storageKey(selected.id), JSON.stringify(session));
      setActive((previous) => ({ ...previous, [selected.id]: session }));
      setSnapshots((previous) => ({ ...previous, [selected.id]: { ...previous[selected.id], sessionId: result.id!, status: "ACTIVE", url: result.url!, expiresAt: result.expiresAt ?? null, reopenable: false } }));
      setNow(Date.now());
    } catch (reopenError) {
      setError(reopenError instanceof Error ? reopenError.message : "평가를 다시 열지 못했습니다.");
    } finally { setBusy(false); }
  }

  async function resetClass() {
    if (!resetTarget) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/sessions/reset", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ classId: resetTarget.id }) });
      if (!response.ok) throw new Error();
      localStorage.removeItem(storageKey(resetTarget.id));
      setActive((previous) => { const next = { ...previous }; delete next[resetTarget.id]; return next; });
      setSnapshots((previous) => ({ ...previous, [resetTarget.id]: { ...previous[resetTarget.id], status: "READY", connected: 0, url: null, expiresAt: null, reopenable: true } }));
      if (resetTarget.id === selected.id) setZoom(false);
      setResetClassId(null);
    } catch { setError("반을 리셋하지 못했습니다."); }
    finally { setBusy(false); }
  }

  return <>
    <section className="card session-selector" id="session-detail">
      <div><div className="teacher-kicker">현장 운영요원</div><h2 style={{ margin: "5px 0 4px" }}>평가할 반을 선택하세요</h2><p style={{ margin: 0, color: "#5b6b84", fontSize: 13 }}>반 번호 순서로 정렬되어 있습니다. 선택한 반의 강사와 QR만 표시됩니다.</p></div>
      <select className="class-picker" value={selectedId} onChange={(event) => chooseClass(event.target.value)}>{displayClasses.map((item) => <option key={item.id} value={item.id}>{item.classCode}반 · {item.room}호 · {item.time} · {rowLabel[item.state]}</option>)}</select>
    </section>
    {error && <div className="error" style={{ marginBottom: 14 }} role="alert">{error}</div>}

    <section className="grid-2 session-main-grid">
      <div className="card qr-session-card">
        <div className="session-heading"><div><span className={`status ${isActive ? "NORMAL" : "INSUFFICIENT"}`}><Radio size={11} />{rowLabel[rowState(selectedSnapshot)]}</span><h2>{selected.classCode}반 · {selected.room}호</h2><div className="live-meta">{selected.instructors.join(" · ") || "배정 강사 없음"}</div></div><div className="session-time"><Clock3 size={14} />{selected.time}</div></div>
        {isActive && remainingMs !== null && <div className={`session-countdown ${remainingMs <= 60_000 ? "urgent" : ""}`} role="timer"><Timer size={15} />{remainingMs > 0 ? <>자동 마감까지 <strong>{formatRemaining(remainingMs)}</strong></> : <strong>마감 처리 중…</strong>}</div>}
        {isActive ? current ? <>
          <button className="qr-only-button" type="button" onClick={() => setZoom(true)}><Image src={current.qr} width={420} height={420} unoptimized alt={`${selected.classCode}반 강의평가 QR 코드`} className="qr-image" /></button>
          <a href={current.url} target="_blank" rel="noreferrer" className="btn btn-secondary full-button">학생 화면 미리보기 <ExternalLink size={15} /></a>
          <button className="btn btn-danger full-button" disabled={busy} onClick={stop}><Square size={14} />평가 종료</button>
        </> : <div className="qr-start-panel"><QrCode size={90} color="#c7d3e3" /><strong>QR 복원 중…</strong><small style={{ color: "#5b6b84" }}>진행 중인 QR 정보를 서버에서 불러오고 있습니다.</small><button className="btn btn-danger full-button" disabled={busy} onClick={stop}><Square size={14} />평가 종료</button></div> :
          canReopen ? <div className="qr-start-panel"><QrCode size={90} color="#c7d3e3" /><strong>평가가 마감되었습니다</strong><small className="session-reopen-help">덜 끝난 학생이 있으면 같은 QR로 15분 다시 열 수 있습니다. 이미 제출한 학생은 다시 제출할 수 없습니다.</small><button className="btn btn-primary full-button" disabled={busy} onClick={reopen}><RefreshCw size={14} />같은 QR로 다시 열기 (15분)</button><details className="session-new-qr"><summary>새 QR로 처음부터 시작</summary><label className="field qr-target-field"><span>평가 대상 인원</span><input type="number" min={1} value={targets[selected.id] || 1} onChange={(event) => setTargets((previous) => ({ ...previous, [selected.id]: Number(event.target.value) }))} /></label><button className="btn btn-secondary full-button" disabled={busy || selected.instructors.length === 0} onClick={start}>새 QR 생성 및 평가 시작</button></details></div> :
          <div className="qr-start-panel"><QrCode size={90} color="#c7d3e3" /><label className="field qr-target-field"><span>평가 대상 인원</span><input type="number" min={1} value={targets[selected.id] || 1} onChange={(event) => setTargets((previous) => ({ ...previous, [selected.id]: Number(event.target.value) }))} /></label><button className="btn btn-primary full-button" disabled={busy || selected.instructors.length === 0} onClick={start}>QR 생성 및 평가 시작 (15분)</button><small className="session-reopen-help">시작 후 15분이 지나면 자동으로 마감됩니다.</small></div>}
        <div className="live-stats" aria-live="polite"><div><span>대상</span><strong>{selectedSnapshot?.targetCount ?? selected.target}명</strong></div><div><span>접속 중</span><strong>{selectedSnapshot?.connected ?? selected.connected}명</strong></div><div><span>제출 완료</span><strong>{selectedSnapshot?.completed ?? selected.submitted}명</strong></div><div><span>미제출</span><strong>{selectedSnapshot?.remaining ?? selected.remaining}명</strong></div></div>
      </div>
      <div className="card"><div className="panel-head"><h2>평가 대상 강사</h2><span>{selected.instructors.length}명</span></div><div style={{ padding: "0 22px 20px", display: "grid", gap: 12 }}>{selected.instructors.map((name) => <div key={name} className="instructor-progress"><strong>{name} 강사</strong><span>개별 평가</span></div>)}</div></div>
    </section>

    <section className="card table-card desktop-schedule">
      <div className="panel-head session-table-head"><h2>등록 일정</h2><div className="session-filter-buttons" role="group" aria-label="일정 상태 필터">{(["ALL", "READY", "ACTIVE"] as const).map((filter) => <button key={filter} type="button" className={`filter-button ${statusFilter === filter ? "active" : ""}`} onClick={() => setStatusFilter(filter)}>{filter === "ALL" ? "전체" : filter === "READY" ? "대기·마감" : "진행 중"}<span>{filter === "ALL" ? displayClasses.length : displayClasses.filter((item) => item.status === filter).length}</span></button>)}</div></div>
      <table className="data-table"><thead><tr><th>시간</th><th>반</th><th>강의실</th><th>평가 대상 강사</th><th>대상</th><th>접속 중</th><th>제출 완료</th><th>미제출</th><th>상태</th><th>관리</th></tr></thead><tbody>{filteredClasses.map((item) => <tr className={item.id === selected.id ? "selected-session-row" : ""} key={item.id}><td>{item.time}</td><td>{item.classCode}반</td><td>{item.room}호</td><td>{item.instructors.join(", ")}</td><td><Users size={13} /> {item.target}명</td><td>{item.connected}명</td><td><strong>{item.submitted}명</strong></td><td>{item.remaining}명</td><td><span className={`status ${item.status === "ACTIVE" ? "NORMAL" : "INSUFFICIENT"}`}>{rowLabel[item.state]}</span></td><td><div className="session-row-actions"><button className={`btn ${item.id === selected.id ? "btn-primary" : "btn-secondary"}`} type="button" onClick={() => chooseClass(item.id)}>{item.id === selected.id ? "선택됨" : "선택"}</button><button className="btn btn-danger" type="button" disabled={item.status !== "ACTIVE" || busy} onClick={() => setResetClassId(item.id)}><RotateCcw size={13} />리셋</button></div></td></tr>)}</tbody></table>
      {filteredClasses.length === 0 && <div className="session-empty-filter">선택한 상태의 일정이 없습니다.</div>}
    </section>

    <section className="mobile-schedule"><div className="mobile-schedule-heading"><h2>등록 일정</h2><span>3초마다 자동 갱신</span></div>{filteredClasses.map((item) => <div className={`mobile-class-card ${item.id === selected.id ? "selected" : ""}`} key={item.id}><button className="mobile-class-select" type="button" onClick={() => chooseClass(item.id)}><span className="mobile-class-room">{item.classCode}반</span><span className="mobile-class-copy"><strong>{item.room}호 · {item.time}</strong><small>접속 {item.connected}명 · 제출 {item.submitted}명</small></span><span className={`status ${item.status === "ACTIVE" ? "NORMAL" : "INSUFFICIENT"}`}>{item.state === "READY" ? "대기" : rowLabel[item.state]}</span></button><button className="mobile-reset-button" type="button" aria-label={`${item.classCode}반 리셋`} disabled={item.status !== "ACTIVE" || busy} onClick={() => setResetClassId(item.id)}><RotateCcw size={15} /></button></div>)}</section>

    {zoom && current && <div className="qr-modal" role="dialog" aria-modal="true" onClick={() => setZoom(false)}><div className="qr-modal-card" onClick={(event) => event.stopPropagation()}><button className="qr-modal-close" type="button" onClick={() => setZoom(false)} aria-label="QR 확대 닫기"><X size={19} /></button><Image src={current.qr} width={420} height={420} unoptimized alt="확대된 강의평가 QR 코드" /><strong>{selected.classCode}반 · {selected.room}호</strong></div></div>}
    {resetTarget && <div className="qr-modal" role="dialog" aria-modal="true" aria-label="반 리셋 확인" onClick={() => setResetClassId(null)}><div className="qr-modal-card reset-confirm-card" onClick={(event) => event.stopPropagation()}><h2>반 리셋</h2><p><strong>{resetTarget.classCode}반</strong>의 진행 중 평가를 종료하고 시작 대기 상태로 전환합니다. 제출 완료 기록은 삭제되지 않습니다.</p><small>Google 인증된 관리자 계정으로 실행됩니다.</small><div className="reset-confirm-actions"><button className="btn btn-secondary" type="button" onClick={() => setResetClassId(null)}>취소</button><button className="btn btn-danger" type="button" disabled={busy} onClick={resetClass}>리셋 실행</button></div></div></div>}
  </>;
}
