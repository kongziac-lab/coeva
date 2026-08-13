"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm({ returnTo }: { returnTo: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  async function submit(event: React.FormEvent) { event.preventDefault(); setLoading(true); setError(""); const response = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }) }); if (!response.ok) { setError("이메일 또는 비밀번호를 확인해 주세요."); setLoading(false); return; } router.push(returnTo.startsWith("/") ? returnTo : "/admin"); router.refresh(); }
  return <div>
    <a className="google-login" href="/api/auth/google"><span className="google-g">G</span> Google Workspace로 로그인</a>
    <div className="login-divider"><span>또는 초기 관리자 로그인</span></div>
    <form onSubmit={submit}><div className="field"><label htmlFor="email">이메일</label><input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div><div className="field"><label htmlFor="password">비밀번호</label><input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></div>{error && <div className="error">{error}</div>}<button className="btn btn-primary" disabled={loading}>{loading ? "확인 중…" : "관리자 로그인"}</button></form>
  </div>;
}
