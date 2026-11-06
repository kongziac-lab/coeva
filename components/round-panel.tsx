"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Play, QrCode, RefreshCw, Square, Timer, X } from "lucide-react";
import QRCode from "qrcode";
import type { SessionClass, SessionPhase } from "@/lib/session-classes";
import { roomLabel, roomNumber } from "@/lib/room";

type Snapshot = {
  classId: string;
  sessionId: string | null;
  phase: SessionPhase;
  targetCount: number;
  connected: number;
  completed: number;
  remaining: number;
  url: string | null;
  expiresAt: string | null;
  graceUntil: string | null;
  reopenable: boolean;
};
type Sort = "room" | "class";
type Filter = "ALL" | SessionPhase;

const phaseLabel: Record<SessionPhase, string> = { READY: "대기", ACTIVE: "진행 중", CLOSED: "마감" };
const filterLabel: Record<Filter, string> = { ALL: "전체", READY: "대기", ACTIVE: "진행 중", CLOSED: "마감" };
const collator = new Intl.Collator("ko", { numeric: true });

function formatRemaining(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function fromClass(item: SessionClass): Snapshot {
  return { classId: item.id, sessionId: item.sessionId, phase: item.phase, targetCount: item.target, connected: item.connected, completed: item.submitted, remaining: item.remaining, url: item.url, expiresAt: item.expiresAt, graceUntil: item.graceUntil, reopenable: item.reopenable };
}

// 운영요원이 휴대폰으로 교실을 돌며 반마다 버튼 한 번으로 평가를 여는 화면.
export function RoundPanel({ classes, termName }: { classes: SessionClass[]; termName: string | null }) {
  const [snapshots, setSnapshots] = useState<Record<string, Snapshot>>(() => Object.fromEntries(classes.map((item) => [item.id, fromClass(item)])));
  const [sort, setSort] = useState<Sort>("room");
  const [filter, setFilter] = useState<Filter>("ALL");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [qrView, setQrView] = useState<{ classId: string; qr: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      try {
        const response = await fetch("/api/admin/sessions", { cache: "no-store" });
        if (!response.ok) return;
        const result = await response.json() as { sessions: Snapshot[] };
        if (cancelled) return;
        setSnapshots((previous) => {
          const next = { ...previous };
          for (const snapshot of result.sessions) if (next[snapshot.classId]) next[snapshot.classId] = snapshot;
          return next;
        });
      } catch { /* Keep the last values and retry. */ }
    }
    const poll = window.setInterval(refresh, 3000);
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => { cancelled = true; window.clearInterval(poll); window.clearInterval(tick); };
  }, []);

  const rows = useMemo(() => {
    const list = classes.map((item) => ({ item, snapshot: snapshots[item.id] ?? fromClass(item) }));
    list.sort((a, b) => sort === "room"
      ? collator.compare(roomNumber(a.item.room), roomNumber(b.item.room)) || collator.compare(a.item.classCode, b.item.classCode)
      : collator.compare(a.item.classCode, b.item.classCode));
    return filter === "ALL" ? list : list.filter((row) => row.snapshot.phase === filter);
  }, [classes, snapshots, sort, filter]);
  const counts = useMemo(() => {
    const result: Record<Filter, number> = { ALL: classes.length, READY: 0, ACTIVE: 0, CLOSED: 0 };
    for (const item of classes) result[(snapshots[item.id] ?? fromClass(item)).phase] += 1;
    return result;
  }, [classes, snapshots]);

  async function act(item: SessionClass, action: "open" | "reopen" | "stop") {
    const snapshot = snapshots[item.id];
    if (action === "stop" && !confirm(`${item.classCode}반 평가를 지금 마감할까요?\n작성 중인 학생도 더 이상 제출할 수 없습니다.`)) return;
    setBusyId(item.id); setError("");
    try {
      let response: Response;
      if (action === "open") response = await fetch("/api/admin/sessions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ classId: item.id, targetCount: Math.max(1, snapshot?.targetCount || item.target || 1) }) });
      else if (action === "reopen") response = await fetch("/api/admin/sessions/reopen", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: snapshot?.sessionId }) });
      else response = await fetch(`/api/admin/sessions?id=${encodeURIComponent(snapshot?.sessionId ?? "")}`, { method: "DELETE" });
      const result = await response.json().catch(() => ({})) as { id?: string; url?: string; expiresAt?: string | null; error?: string };
      if (!response.ok) {
        if (result.error === "session_already_active") throw new Error(`${item.classCode}반은 이미 진행 중입니다.`);
        if (result.error === "class_not_in_active_term") throw new Error("운영 학기가 바뀌었습니다. 화면을 새로고침해 주세요.");
        if (result.error === "qr_not_restorable") throw new Error(`${item.classCode}반은 QR 정보가 없어 다시 열 수 없습니다. 현장 평가 화면에서 새 QR로 시작해 주세요.`);
        throw new Error(`${item.classCode}반 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.`);
      }
      setSnapshots((previous) => {
        const current = previous[item.id] ?? fromClass(item);
        if (action === "stop") return { ...previous, [item.id]: { ...current, phase: "CLOSED", connected: 0, url: null, expiresAt: null, graceUntil: null, reopenable: true } };
        return { ...previous, [item.id]: { ...current, sessionId: result.id ?? current.sessionId, phase: "ACTIVE", url: result.url ?? current.url, expiresAt: result.expiresAt ?? null, graceUntil: null, reopenable: false } };
      });
      setNow(Date.now());
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "처리에 실패했습니다.");
    } finally { setBusyId(null); }
  }

  async function showQr(classId: string, url: string | null) {
    if (!url) return;
    setQrView({ classId, qr: await QRCode.toDataURL(url, { width: 640, margin: 1, color: { dark: "#0d3168", light: "#ffffff" } }) });
  }
  const qrClass = qrView ? classes.find((item) => item.id === qrView.classId) : null;

  return <div className="round-page">
    <header className="round-head">
      <Link href="/admin/sessions" className="round-back" aria-label="현장 평가로 돌아가기"><ArrowLeft size={18} /></Link>
      <div><strong>순회 모드</strong><span>{termName ?? ""} · 열면 15분 뒤 자동 마감</span></div>
    </header>
    <div className="round-controls">
      <div className="session-filter-buttons" role="group" aria-label="상태 필터">{(["ALL", "READY", "ACTIVE", "CLOSED"] as const).map((key) => <button key={key} type="button" className={`filter-button ${filter === key ? "active" : ""}`} onClick={() => setFilter(key)}>{filterLabel[key]}<span>{counts[key]}</span></button>)}</div>
      <div className="session-filter-buttons" role="group" aria-label="정렬">{(["room", "class"] as const).map((key) => <button key={key} type="button" className={`filter-button ${sort === key ? "active" : ""}`} onClick={() => setSort(key)}>{key === "room" ? "강의실순" : "반순"}</button>)}</div>
    </div>
    {error && <div className="error round-error" role="alert">{error}</div>}
    <ul className="round-list">
      {rows.map(({ item, snapshot }) => {
        const remainingMs = snapshot.phase === "ACTIVE" && snapshot.expiresAt ? new Date(snapshot.expiresAt).getTime() - now : null;
        const graceMs = snapshot.phase === "CLOSED" && snapshot.graceUntil ? new Date(snapshot.graceUntil).getTime() - now : null;
        const busy = busyId === item.id;
        return <li key={item.id} className={`round-card phase-${snapshot.phase}`}>
          <div className="round-card-main">
            <div className="round-room">{roomNumber(item.room)}<small>호</small></div>
            <div className="round-info">
              <strong>{item.classCode}반 <span className={`status ${snapshot.phase === "ACTIVE" ? "NORMAL" : "INSUFFICIENT"}`}>{phaseLabel[snapshot.phase]}</span></strong>
              <span>{item.instructors.join(" · ") || "배정 강사 없음"}</span>
              <span className="round-stats">제출 <b>{snapshot.completed}</b> / {snapshot.targetCount}명{snapshot.phase === "ACTIVE" ? ` · 접속 ${snapshot.connected}명` : ""}</span>
              {graceMs !== null && graceMs > 0 && <span className="round-grace">마감 · 작성 중 {snapshot.connected}명 제출 가능 {formatRemaining(graceMs)}</span>}
            </div>
            {remainingMs !== null && <div className={`round-timer ${remainingMs <= 60_000 ? "urgent" : ""}`}><Timer size={13} />{remainingMs > 0 ? formatRemaining(remainingMs) : "마감 중"}</div>}
          </div>
          <div className="round-actions">
            {snapshot.phase === "READY" && <button className="btn btn-primary" type="button" disabled={busy || item.instructors.length === 0} onClick={() => act(item, "open")}><Play size={15} />{busy ? "여는 중…" : "열기 (15분)"}</button>}
            {snapshot.phase === "ACTIVE" && <><button className="btn btn-secondary" type="button" disabled={!snapshot.url} onClick={() => showQr(item.id, snapshot.url)}><QrCode size={15} />QR 보기</button><button className="btn btn-danger" type="button" disabled={busy} onClick={() => act(item, "stop")}><Square size={13} />마감</button></>}
            {snapshot.phase === "CLOSED" && (snapshot.reopenable
              ? <button className="btn btn-secondary" type="button" disabled={busy} onClick={() => act(item, "reopen")}><RefreshCw size={15} />{busy ? "여는 중…" : "다시 열기 (15분)"}</button>
              : <span className="round-note">현장 평가 화면에서 새 QR로 시작하세요</span>)}
          </div>
        </li>;
      })}
    </ul>
    {rows.length === 0 && <p className="round-empty">해당 상태의 반이 없습니다.</p>}
    {qrView && qrClass && <div className="qr-modal" role="dialog" aria-modal="true" onClick={() => setQrView(null)}><div className="qr-modal-card" onClick={(event) => event.stopPropagation()}><button className="qr-modal-close" type="button" onClick={() => setQrView(null)} aria-label="QR 닫기"><X size={19} /></button><Image src={qrView.qr} width={640} height={640} unoptimized alt={`${qrClass.classCode}반 강의평가 QR 코드`} /><strong>{qrClass.classCode}반 · {roomLabel(qrClass.room)}</strong></div></div>}
  </div>;
}
