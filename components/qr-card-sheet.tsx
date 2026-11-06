"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Download, Printer } from "lucide-react";
import QRCode from "qrcode";
import { renderQrSlide } from "@/lib/qr-slide";
import { createZip, safeFileName } from "@/lib/zip";

type Card = { classId: string; classCode: string; room: string; instructors: string[]; url: string; qr?: string };
type Layout = "single" | "quad";

export function QrCardSheet() {
  const [cards, setCards] = useState<Card[]>([]);
  const [termName, setTermName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [layout, setLayout] = useState<Layout>("quad");
  const [saving, setSaving] = useState<string | null>(null);

  // 반마다 1920×1080 PNG를 만들어 ZIP 하나로 내려받는다(USB에 담아 교실 TV·PC에서 띄우는 용도).
  async function downloadImages() {
    if (!cards.length) return;
    setError("");
    try {
      await document.fonts?.ready;
      const fontFamily = getComputedStyle(document.body).fontFamily || "sans-serif";
      const files = [];
      for (const [index, card] of cards.entries()) {
        setSaving(`${index + 1} / ${cards.length}`);
        files.push({ name: safeFileName(`${card.classCode}반_${card.room}호.png`), data: await renderQrSlide(card, termName, fontFamily) });
      }
      const zip = createZip(files);
      const url = URL.createObjectURL(new Blob([zip.buffer as ArrayBuffer], { type: "application/zip" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = safeFileName(`강의평가_QR_${termName || "운영학기"}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch {
      setError("QR 이미지를 만들지 못했습니다. 다른 브라우저(Chrome·Edge)에서 다시 시도해 주세요.");
    } finally { setSaving(null); }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/admin/sessions/cards", { method: "POST", cache: "no-store" });
        const result = await response.json() as { termName?: string; cards?: Card[]; error?: string };
        if (!response.ok || !result.cards) throw new Error(result.error === "no_active_term" ? "운영 학기가 없습니다. 학기 관리에서 먼저 학기를 만들어 주세요." : "QR 카드를 준비하지 못했습니다.");
        const withQr = await Promise.all(result.cards.map(async (card) => ({ ...card, qr: await QRCode.toDataURL(card.url, { width: 640, margin: 1, errorCorrectionLevel: "M", color: { dark: "#0d3168", light: "#ffffff" } }) })));
        if (!cancelled) { setCards(withQr); setTermName(result.termName ?? ""); }
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "QR 카드를 준비하지 못했습니다.");
      } finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  return <div className={`qr-cards-page layout-${layout}`}>
    <header className="qr-cards-toolbar no-print">
      <Link href="/admin/sessions" className="btn btn-secondary"><ArrowLeft size={15} />현장 평가로</Link>
      <div className="qr-cards-title"><strong>QR 카드 인쇄·저장</strong><span>{termName ? `${termName} · ` : ""}{cards.length}개 반</span></div>
      <div className="session-filter-buttons" role="group" aria-label="인쇄 배치">
        <button type="button" className={`filter-button ${layout === "quad" ? "active" : ""}`} onClick={() => setLayout("quad")}>한 장에 4반</button>
        <button type="button" className={`filter-button ${layout === "single" ? "active" : ""}`} onClick={() => setLayout("single")}>한 장에 1반</button>
      </div>
      <button className="btn btn-secondary" type="button" disabled={!cards.length || saving !== null} onClick={downloadImages}><Download size={15} />{saving ? `이미지 만드는 중 ${saving}` : "이미지로 저장 (USB용 ZIP)"}</button>
      <button className="btn btn-primary" type="button" disabled={!cards.length} onClick={() => window.print()}><Printer size={15} />인쇄</button>
    </header>
    <p className="qr-cards-help no-print">카드의 QR은 운영요원이 <strong>열기</strong>를 누르기 전까지 제출을 받지 않습니다. 열면 15분 뒤 자동으로 마감되고, 같은 카드로 다시 열 수 있습니다. 현장 평가에서 &quot;새 QR로 시작&quot;을 누른 반은 카드를 다시 인쇄해야 합니다. &quot;이미지로 저장&quot;은 반마다 화면용 그림 파일(1920×1080 PNG)을 ZIP 하나로 내려받습니다. 압축을 풀어 USB에 담고 교실 PC·TV에서 열면 됩니다.</p>
    {loading && <p className="qr-cards-help no-print">QR 카드를 준비하는 중…</p>}
    {error && <div className="error no-print" role="alert">{error}</div>}
    <div className="qr-cards-grid">
      {cards.map((card) => <article key={card.classId} className="qr-card">
        <div className="qr-card-head"><span className="qr-card-brand">K-강의평가</span><span>{termName}</span></div>
        <h2>{card.classCode}반 <small>{card.room}호</small></h2>
        {card.qr && <Image src={card.qr} width={640} height={640} unoptimized alt={`${card.classCode}반 강의평가 QR 코드`} className="qr-card-code" />}
        <p className="qr-card-cta">휴대폰 카메라로 QR을 스캔하세요<br /><span>Scan the QR code with your phone camera</span></p>
        {card.instructors.length > 0 && <p className="qr-card-instructors">{card.instructors.join(" · ")}</p>}
      </article>)}
    </div>
  </div>;
}
