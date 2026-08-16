"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm({ returnTo, mfaRequired: initialMfa }: { returnTo: string; mfaRequired?: boolean }) {
  const [step, setStep] = useState<"credentials" | "totp">(initialMfa ? "totp" : "credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => { codeRef.current?.focus(); }, [step]);

  async function submitCredentials(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const response = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { setError("이메일 또는 비밀번호를 확인해 주세요."); setLoading(false); return; }
    if (data.mfaRequired) { setStep("totp"); setLoading(false); return; }
    router.push(returnTo.startsWith("/") ? returnTo : "/admin");
    router.refresh();
  }

  async function submitTotp(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const response = await fetch("/api/auth/verify-totp", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code }) });
    if (!response.ok) { setError("인증 코드가 올바르지 않습니다."); setLoading(false); return; }
    router.push(returnTo.startsWith("/") ? returnTo : "/admin");
    router.refresh();
  }

  return <div>
    {step === "credentials" ? <>
      <a className="google-login" href="/api/auth/google"><span className="google-g">G</span> Google Workspace로 로그인</a>
      <div className="login-divider"><span>또는 초기 관리자 로그인</span></div>
      <form onSubmit={submitCredentials}><div className="field"><label htmlFor="email">이메일</label><input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div><div className="field"><label htmlFor="password">비밀번호</label><input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></div>{error && <div className="error">{error}</div>}<button className="btn btn-primary" disabled={loading}>{loading ? "확인 중…" : "관리자 로그인"}</button></form>
    </> : <>
      <h2 style={{ margin: "0 0 6px", fontSize: 20 }}>Google Authenticator 인증</h2>
      <p style={{ margin: "0 0 18px", color: "#65758a", fontSize: 13 }}>앱에 표시된 6자리 코드를 입력하세요.</p>
      <form onSubmit={submitTotp}><div className="field"><label htmlFor="totp-code">인증 코드</label><input id="totp-code" ref={codeRef} type="text" inputMode="numeric" pattern="\d{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} required /></div>{error && <div className="error">{error}</div>}<button className="btn btn-primary" disabled={loading || code.length !== 6}>{loading ? "확인 중…" : "인증하기"}</button></form>
    </>}
  </div>;
}
