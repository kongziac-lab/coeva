"use client";

import { useEffect, useState } from "react";
import { Clock3, ExternalLink, QrCode, Radio, Square, Users, X } from "lucide-react";
import QRCode from "qrcode";

export type SessionClass = { id: string; room: string; classCode: string; time: string; instructors: string[]; target: number; submitted: number; status: string; sessionId: string | null };
type ActiveSession = { id: string; url: string; qr: string };
type StatusFilter = "ALL" | "READY" | "ACTIVE";
type LiveStats = { targetCount: number; connected: number; inProgress: number; completed: number; remaining: number; status: string; updatedAt: string };

export function SessionOperatorPanel({ classes }: { classes: SessionClass[] }) {
  const [selectedId, setSelectedId] = useState(classes[0]?.id ?? "");
  const [targets, setTargets] = useState<Record<string, number>>(Object.fromEntries(classes.map((item) => [item.id, item.target || 1])));
  const [active, setActive] = useState<Record<string, ActiveSession>>({});
  const [zoom, setZoom] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [liveStats, setLiveStats] = useState<LiveStats | null>(null);
  const selected = classes.find((item) => item.id === selectedId) ?? classes[0];
  if (!selected) return null;
  const current = active[selected.id];
  const isActive = Boolean(current) || selected.status === "ACTIVE";
  const filteredClasses = statusFilter === "ALL" ? classes : classes.filter((item) => item.status === statusFilter);
  const monitorId = current?.id ?? selected.sessionId;

  useEffect(() => {
    if (!monitorId) { setLiveStats(null); return; }
    let cancelled = false;
    async function refresh() {
      try {
        const response = await fetch(`/api/admin/sessions?id=${encodeURIComponent(monitorId)}`, { cache: "no-store" });
        if (!response.ok) return;
        const next = await response.json() as LiveStats;
        if (!cancelled) setLiveStats(next);
      } catch { /* The next poll retries without interrupting the operator. */ }
    }
    refresh();
    const timer = window.setInterval(refresh, 5000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [monitorId]);

  function chooseClass(id: string) {
    setSelectedId(id); setZoom(false); setError("");
    document.getElementById("session-detail")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function start() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/sessions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ classId: selected.id, targetCount: Math.max(1, targets[selected.id] || 1), durationMinutes: 10 }) });
      const result = await response.json() as { id?: string; url?: string; error?: string };
      if (!response.ok || !result.id || !result.url) throw new Error(result.error === "questionnaire_required" ? "먼저 설문을 등록해 주세요." : "평가 세션을 시작하지 못했습니다.");
      const qr = await QRCode.toDataURL(result.url, { width: 420, margin: 1, color: { dark: "#102b4e", light: "#ffffff" } });
      setActive((previous) => ({ ...previous, [selected.id]: { id: result.id!, url: result.url!, qr } }));
    } catch (startError) { setError(startError instanceof Error ? startError.message : "평가 세션을 시작하지 못했습니다."); }
    finally { setBusy(false); }
  }

  async function stop() {
    const id = current?.id ?? selected.sessionId;
    if (!id) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/admin/sessions?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!response.ok) throw new Error();
      setActive((previous) => { const next = { ...previous }; delete next[selected.id]; return next; });
      location.reload();
    } catch { setError("평가 세션을 종료하지 못했습니다."); setBusy(false); }
  }

  return <>
    <section className="card session-selector" id="session-detail"><div><div className="teacher-kicker">현장 운영요원</div><h2 style={{ margin: "5px 0 4px" }}>평가할 반을 선택하세요</h2><p style={{ margin: 0, color: "#65758a", fontSize: 13 }}>반 번호 순서로 정렬되어 있습니다. 선택한 반의 강사와 QR만 표시됩니다.</p></div><select className="class-picker" value={selectedId} onChange={(event) => chooseClass(event.target.value)}>{classes.map((item) => <option key={item.id} value={item.id}>{item.classCode}반 · {item.room}호 · {item.time}</option>)}</select></section>
    {error && <div className="error" style={{ marginBottom: 14 }} role="alert">{error}</div>}
    <section className="grid-2 session-main-grid"><div className="card qr-session-card"><div className="session-heading"><div><span className={`status ${isActive ? "NORMAL" : "INSUFFICIENT"}`}><Radio size={11} />{isActive ? "진행 중" : "시작 대기"}</span><h2>{selected.classCode}반 · {selected.room}호</h2><div className="live-meta">{selected.instructors.join(" · ") || "배정 강사 없음"}</div></div><div className="session-time"><Clock3 size={14} />{selected.time}</div></div>{current ? <><button className="qr-only-button" type="button" onClick={() => setZoom(true)}><img src={current.qr} alt={`${selected.classCode}반 강의평가 QR 코드`} className="qr-image" /></button><a href={current.url} target="_blank" rel="noreferrer" className="btn btn-secondary full-button">학생 화면 미리보기 <ExternalLink size={15} /></a><button className="btn btn-danger full-button" disabled={busy} onClick={stop}><Square size={14} />평가 종료</button></> : <div style={{ padding: "34px 0", display: "grid", gap: 14 }}><QrCode size={90} color="#c5d0dc" style={{ margin: "auto" }} /><label className="field"><span>평가 대상 인원</span><input type="number" min={1} value={targets[selected.id] || 1} onChange={(event) => setTargets((previous) => ({ ...previous, [selected.id]: Number(event.target.value) }))} /></label><button className="btn btn-primary full-button" disabled={busy || isActive || selected.instructors.length === 0} onClick={start}>{isActive ? "이미 진행 중" : "QR 생성 및 평가 시작"}</button>{isActive && !current && <small style={{ color: "#65758a" }}>진행 중인 QR은 보안상 다시 표시되지 않습니다. 기존 세션을 종료한 뒤 새로 시작하세요.</small>}{isActive && selected.sessionId && <button className="btn btn-danger full-button" disabled={busy} onClick={stop}>기존 평가 종료</button>}</div>}<div className="live-stats" aria-live="polite"><div><span>대상</span><strong>{liveStats?.targetCount ?? selected.target}명</strong></div><div><span>접속 중</span><strong>{liveStats?.connected ?? 0}명</strong></div><div><span>제출 완료</span><strong>{liveStats?.completed ?? 0}명</strong></div><div><span>미제출</span><strong>{liveStats?.remaining ?? selected.target}명</strong></div></div></div><div className="card"><div className="panel-head"><h2>평가 대상 강사</h2><span>{selected.instructors.length}명</span></div><div style={{ padding: "0 22px 20px", display: "grid", gap: 12 }}>{selected.instructors.map((name) => <div key={name} className="instructor-progress"><strong>{name} 강사</strong><span>개별 평가</span></div>)}</div></div></section>
    <section className="card table-card desktop-schedule"><div className="panel-head session-table-head"><h2>등록 일정</h2><div className="session-filter-buttons" role="group" aria-label="일정 상태 필터">{(["ALL", "READY", "ACTIVE"] as const).map((filter) => <button key={filter} type="button" className={`filter-button ${statusFilter === filter ? "active" : ""}`} onClick={() => setStatusFilter(filter)}>{filter === "ALL" ? "전체" : filter === "READY" ? "시작 대기" : "진행 중"}<span>{filter === "ALL" ? classes.length : classes.filter((item) => item.status === filter).length}</span></button>)}</div></div><table className="data-table"><thead><tr><th>시간</th><th>반</th><th>강의실</th><th>평가 대상 강사</th><th>대상</th><th>상태</th><th>선택</th></tr></thead><tbody>{filteredClasses.map((item) => <tr className={item.id === selected.id ? "selected-session-row" : ""} key={item.id}><td>{item.time}</td><td>{item.classCode}반</td><td>{item.room}호</td><td>{item.instructors.join(", ")}</td><td><Users size={13} /> {item.target}명</td><td><span className={`status ${item.status === "ACTIVE" ? "NORMAL" : "INSUFFICIENT"}`}>{item.status === "ACTIVE" ? "진행 중" : "시작 대기"}</span></td><td><button className={`btn ${item.id === selected.id ? "btn-primary" : "btn-secondary"}`} type="button" onClick={() => chooseClass(item.id)}>{item.id === selected.id ? "선택됨" : "선택"}</button></td></tr>)}</tbody></table>{filteredClasses.length === 0 && <div className="session-empty-filter">선택한 상태의 일정이 없습니다.</div>}</section>
    {zoom && current && <div className="qr-modal" role="dialog" aria-modal="true" onClick={() => setZoom(false)}><div className="qr-modal-card" onClick={(event) => event.stopPropagation()}><button className="qr-modal-close" type="button" onClick={() => setZoom(false)}><X size={19} /></button><img src={current.qr} alt="확대된 강의평가 QR 코드" /><strong>{selected.classCode}반 · {selected.room}호</strong></div></div>}
  </>;
}
