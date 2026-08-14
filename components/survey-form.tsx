"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, LockKeyhole, UserRound } from "lucide-react";
import { copy, languageNames, Locale, locales } from "@/lib/i18n";

export type SurveyInstructor = { assignmentId: string; name: string; photoUrl: string | null };

type SurveyFormProps = {
  classCode: string;
  room: string;
  instructors: SurveyInstructor[];
  token?: string;
};

export function SurveyForm({ classCode, room, instructors, token }: SurveyFormProps) {
  const [locale, setLocale] = useState<Locale>("ko");
  const [noticeAccepted, setNoticeAccepted] = useState(false);
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [receipt, setReceipt] = useState("");
  const [answers, setAnswers] = useState<Record<number, number[]>>({});
  const [comments, setComments] = useState<Record<number, string>>({});

  const t = copy[locale];
  const current = answers[step] ?? Array(7).fill(0);
  const valid = current.every(Boolean);
  const fallbackReceipt = useMemo(
    () => `KMLI-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    [],
  );

  useEffect(() => {
    const detected = navigator.language.split("-")[0] as Locale;
    if (locales.includes(detected)) setLocale(detected);
    if (!localStorage.getItem("coeva_device")) {
      localStorage.setItem("coeva_device", `${crypto.randomUUID()}${crypto.randomUUID()}`);
    }
  }, []);

  function setRating(question: number, value: number) {
    setAnswers((all) => ({
      ...all,
      [step]: (all[step] ?? Array(7).fill(0)).map((answer, index) => index === question ? value : answer),
    }));
  }

  async function startEvaluation() {
    if (!token) { setStarted(true); return; }
    setStarting(true); setSubmitError("");
    try {
      const response = await fetch(`/api/survey/${encodeURIComponent(token)}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ deviceId: localStorage.getItem("coeva_device") }) });
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error === "already_submitted" ? t.duplicateError : t.submitError);
      setStarted(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : t.submitError);
    } finally { setStarting(false); }
  }

  useEffect(() => {
    if (!started || done || !token) return;
    const surveyToken = token;
    let cancelled = false;
    async function heartbeat() {
      try {
        const response = await fetch(`/api/survey/${encodeURIComponent(surveyToken)}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ deviceId: localStorage.getItem("coeva_device") }) });
        if (!response.ok && !cancelled) setSubmitError(t.submitError);
      } catch { /* The next heartbeat retries. */ }
    }
    const timer = window.setInterval(heartbeat, 15000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [started, done, token, t.submitError]);

  async function finish() {
    if (!token) {
      setReceipt(fallbackReceipt);
      setDone(true);
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    try {
      const response = await fetch(`/api/survey/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          deviceId: localStorage.getItem("coeva_device"),
          language: locale,
          responses: instructors.map((instructor, index) => ({
            assignmentId: instructor.assignmentId,
            answers: answers[index] ?? (index === step ? current : []),
            comment: comments[index],
          })),
        }),
      });
      const body = await response.json() as { error?: string; receipt?: string };
      if (!response.ok) throw new Error(body.error === "already_submitted" ? t.duplicateError : t.submitError);
      setReceipt(body.receipt ?? fallbackReceipt);
      setDone(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : t.submitError);
    } finally {
      setSubmitting(false);
    }
  }

  const languageSelect = (
    <select className="language" value={locale} onChange={(event) => setLocale(event.target.value as Locale)} aria-label="Language">
      {locales.map((item) => <option key={item} value={item}>{languageNames[item]}</option>)}
    </select>
  );

  if (done) return (
    <main className="survey-page">
      <div className="survey-shell">
        <div className="survey-top"><div className="survey-brand"><div className="brand-mark">K</div>K-강의평가</div>{languageSelect}</div>
        <div className="card done-card">
          <div className="done-icon"><Check size={36} /></div>
          <h1>{t.done}</h1><p>{t.doneBody}</p>
          <div className="receipt">{classCode} · {room}<br />{t.receipt} <strong>{receipt}</strong><br />{t.showReceipt}</div>
        </div>
      </div>
    </main>
  );

  if (!started) return (
    <main className="survey-page">
      <div className="survey-shell">
        <div className="survey-top"><div className="survey-brand"><div className="brand-mark">K</div>K-강의평가</div>{languageSelect}</div>
        <div className="survey-intro"><h1>{t.title}</h1><p>{t.subtitle}</p></div>
        <section className="card survey-notice-card">
          <div className="notice-lock"><LockKeyhole size={24} /></div>
          <h2>{t.noticeTitle}</h2><p>{t.noticeBody}</p>
          <label className="notice-check"><input type="checkbox" checked={noticeAccepted} onChange={(event) => setNoticeAccepted(event.target.checked)} /><span>{t.noticeConfirm}</span></label>
          {submitError && <div className="error" role="alert">{submitError}</div>}
          <button className="btn btn-primary full-button" type="button" disabled={!noticeAccepted || starting} onClick={startEvaluation}>{starting ? t.submitting : t.start}</button>
        </section>
        <div className="privacy-note"><LockKeyhole size={13} />{t.privacy}</div>
      </div>
    </main>
  );

  const instructor = instructors[step];
  return (
    <main className="survey-page"><div className="survey-shell">
      <div className="survey-top"><div className="survey-brand"><div className="brand-mark">K</div>K-강의평가</div>{languageSelect}</div>
      <div className="survey-intro"><h1>{t.title}</h1><p>{t.subtitle}</p></div>
      <div className="step-track" aria-label={`${step + 1} / ${instructors.length}`}>{instructors.map((item, index) => <i key={item.assignmentId} className={index <= step ? "done" : ""} />)}</div>
      <section className="card teacher-card">
        <div className="teacher-heading">
          <div className="teacher-photo-wrap">
            {instructor.photoUrl ? <img className="teacher-photo" src={instructor.photoUrl} alt={`${instructor.name} ${t.instructorSuffix}`} /> : <UserRound size={38} aria-hidden="true" />}
          </div>
          <div><div className="teacher-kicker">{t.progress} {step + 1} / {instructors.length}</div><div className="teacher-name">{instructor.name} {t.instructorSuffix}</div><span className="class-chip">{classCode} · {room}</span></div>
        </div>
        {t.questions.map((question, questionIndex) => (
          <fieldset className="question" key={questionIndex}>
            <legend className="question-label">{questionIndex + 1}. {question}</legend>
            <div className="rating">
              {[1, 2, 3, 4, 5].map((value) => (
                <span key={value} className="rating-option">
                  <input id={`q${step}-${questionIndex}-${value}`} type="radio" name={`q${step}-${questionIndex}`} checked={current[questionIndex] === value} onChange={() => setRating(questionIndex, value)} />
                  <label htmlFor={`q${step}-${questionIndex}-${value}`}><strong>{value}</strong><small>{t.scale[value - 1]}</small></label>
                </span>
              ))}
            </div>
          </fieldset>
        ))}
        <div className="question"><div className="question-label">{t.comment} <span className="optional-label">({t.optional})</span></div><textarea className="comment-box" value={comments[step] ?? ""} onChange={(event) => setComments((all) => ({ ...all, [step]: event.target.value }))} maxLength={1000} /></div>
        {submitError && <div className="error" role="alert">{submitError}</div>}
        <div className="survey-actions">
          {step > 0 && <button className="btn btn-secondary" type="button" onClick={() => setStep(step - 1)}>{t.back}</button>}
          <button className="btn btn-primary" type="button" disabled={!valid || submitting} onClick={() => step < instructors.length - 1 ? setStep(step + 1) : finish()}>{submitting ? t.submitting : step < instructors.length - 1 ? t.next : t.submit}</button>
        </div>
      </section>
      <div className="privacy-note"><LockKeyhole size={13} />{t.privacy}</div>
    </div></main>
  );
}
