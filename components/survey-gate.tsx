"use client";

import { useEffect, useState } from "react";
import { Clock3, LockKeyhole, RefreshCw } from "lucide-react";
import { copy, detectBrowserLocale, languageNames, Locale, locales } from "@/lib/i18n";

// 열리기 전이거나 마감된 QR을 스캔한 학생용 안내. 대기 중이면 평가가 열리는 순간 자동으로 설문으로 바뀐다.
export function SurveyGateScreen({ token, state, classCode, room }: { token: string; state: "pending" | "closed"; classCode: string; room: string }) {
  const [locale, setLocale] = useState<Locale>("ko");
  const t = copy[locale];

  useEffect(() => {
    const detected = detectBrowserLocale(navigator.languages?.length ? navigator.languages : [navigator.language]);
    if (detected) setLocale(detected);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const response = await fetch(`/api/survey/${encodeURIComponent(token)}`, { cache: "no-store" });
        if (response.ok && !cancelled) window.location.reload();
      } catch { /* Try again on the next interval. */ }
    }
    const timer = window.setInterval(check, state === "pending" ? 4000 : 10000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [token, state]);

  return <main className="survey-page" lang={locale}>
    <div className="survey-shell">
      <div className="survey-top"><div className="survey-brand"><div className="brand-mark">K</div>K-강의평가</div>
        <select className="language" value={locale} onChange={(event) => setLocale(event.target.value as Locale)} aria-label="Language">{locales.map((item) => <option key={item} value={item}>{languageNames[item]}</option>)}</select>
      </div>
      <section className="card survey-notice-card survey-gate-card" aria-live="polite">
        <div className="notice-lock">{state === "pending" ? <Clock3 size={24} /> : <LockKeyhole size={24} />}</div>
        <span className="class-chip">{classCode} · {room}</span>
        <h2>{state === "pending" ? t.pendingTitle : t.gateClosedTitle}</h2>
        <p>{state === "pending" ? t.pendingBody : t.gateClosedBody}</p>
        <button className="btn btn-secondary full-button" type="button" onClick={() => window.location.reload()}><RefreshCw size={15} />{t.refresh}</button>
      </section>
    </div>
  </main>;
}
