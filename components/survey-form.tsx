"use client";
import { useEffect, useMemo, useState } from "react";
import { Check, LockKeyhole } from "lucide-react";
import { copy, Locale, locales } from "@/lib/i18n";

export function SurveyForm({ classCode, room, instructors, token, assignmentIds }: { classCode: string; room: string; instructors: string[]; token?: string; assignmentIds?: string[] }) {
  const detected = typeof navigator !== "undefined" ? navigator.language.split("-")[0] : "ko";
  const [locale, setLocale] = useState<Locale>(locales.includes(detected as Locale) ? detected as Locale : "ko");
  const [step, setStep] = useState(0); const [done, setDone] = useState(false); const [submitting,setSubmitting]=useState(false); const [submitError,setSubmitError]=useState("");
  const [answers, setAnswers] = useState<Record<number, number[]>>({}); const [comments, setComments] = useState<Record<number, string>>({});
  const t = copy[locale]; const current = answers[step] ?? Array(7).fill(0); const valid = current.every(Boolean);
  const setRating = (q: number, value: number) => setAnswers((all)=>({...all,[step]:(all[step] ?? Array(7).fill(0)).map((v,i)=>i===q?value:v)}));
  const completionCode = useMemo(()=>`KMLI-${new Date().getFullYear()}-${Math.random().toString(36).slice(2,8).toUpperCase()}`,[]);
  useEffect(()=>{if(!localStorage.getItem("coeva_device"))localStorage.setItem("coeva_device",`${crypto.randomUUID()}${crypto.randomUUID()}`)},[]);
  async function finish(){if(!token||!assignmentIds){setDone(true);return}setSubmitting(true);setSubmitError("");try{const response=await fetch(`/api/survey/${encodeURIComponent(token)}`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({deviceId:localStorage.getItem("coeva_device"),language:locale,responses:assignmentIds.map((assignmentId,i)=>({assignmentId,answers:answers[i]??(i===step?current:[]),comment:comments[i]}))})});if(!response.ok){const body=await response.json();throw new Error(body.error==="already_submitted"?"이 기기에서는 이미 평가를 제출했습니다.":"제출하지 못했습니다. 조사자에게 알려 주세요.")}setDone(true)}catch(e){setSubmitError(e instanceof Error?e.message:"제출하지 못했습니다.")}finally{setSubmitting(false)}}
  if (done) return <main className="survey-page"><div className="survey-shell"><div className="survey-top"><div className="survey-brand"><div className="brand-mark">K</div>K-강의평가</div></div><div className="card done-card"><div className="done-icon"><Check size={36}/></div><h1>{t.done}</h1><p>{t.doneBody}</p><div className="receipt">{classCode} · {room}호 · 완료 확인번호 {completionCode}<br/>이 화면을 조사자에게 보여주세요.</div></div></div></main>;
  return <main className="survey-page"><div className="survey-shell">
    <div className="survey-top"><div className="survey-brand"><div className="brand-mark">K</div>K-강의평가</div><select className="language" value={locale} onChange={(e)=>setLocale(e.target.value as Locale)} aria-label="Language"><option value="ko">한국어</option><option value="en">English</option><option value="zh">中文</option><option value="vi">Tiếng Việt</option><option value="mn">Монгол</option></select></div>
    <div className="survey-intro"><h1>{t.title}</h1><p>{t.subtitle}</p></div><div className="step-track">{instructors.map((_,i)=><i key={i} className={i<=step?"done":""}/>)}</div>
    <section className="card teacher-card"><div className="teacher-kicker">{t.progress} {step+1} / {instructors.length}</div><div className="teacher-name">{instructors[step]} 강사</div><span className="class-chip">{classCode} · {room}호</span>
      {t.questions.map((question,q)=><div className="question" key={q}><div className="question-label">{q+1}. {question}</div><div className="rating">{[1,2,3,4,5].map((v)=><span key={v}><input id={`q${q}-${v}`} type="radio" name={`q${q}`} checked={current[q]===v} onChange={()=>setRating(q,v)}/><label htmlFor={`q${q}-${v}`}>{v}</label></span>)}</div><div className="scale-labels"><span>{t.scale[0]}</span><span>{t.scale[1]}</span></div></div>)}
      <div className="question"><div className="question-label">{t.comment} <span style={{color:'#8b98a8',fontSize:11}}>({t.optional})</span></div><textarea className="comment-box" value={comments[step]??""} onChange={(e)=>setComments((all)=>({...all,[step]:e.target.value}))} maxLength={1000}/></div>
      {submitError&&<div className="error">{submitError}</div>}<div className="survey-actions">{step>0&&<button className="btn btn-secondary" onClick={()=>setStep(step-1)}>{t.back}</button>}<button className="btn btn-primary" disabled={!valid||submitting} style={{opacity:valid&&!submitting?1:.45}} onClick={()=>step<instructors.length-1?setStep(step+1):finish()}>{submitting?"제출 중…":step<instructors.length-1?t.next:t.submit}</button></div>
    </section><div className="privacy-note"><LockKeyhole size={13}/>{t.privacy}</div>
  </div></main>;
}
