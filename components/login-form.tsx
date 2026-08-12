"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm({ returnTo }: { returnTo: string }) {
  const [email, setEmail] = useState("admin@kmu.ac.kr");
  const [password, setPassword] = useState("demo-admin");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setLoading(true); setError("");
    const response = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }) });
    if (!response.ok) { setError("이메일 또는 비밀번호를 확인해 주세요."); setLoading(false); return; }
    router.push(returnTo.startsWith("/") ? returnTo : "/admin"); router.refresh();
  }

  return <form onSubmit={submit}>
    <div className="field"><label htmlFor="email">이메일</label><input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
    <div className="field"><label htmlFor="password">비밀번호</label><input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></div>
    {error && <div className="error">{error}</div>}
    <button className="btn btn-primary" disabled={loading}>{loading ? "확인 중…" : "로그인"}</button>
    <div style={{ marginTop: 14, textAlign: "center", fontSize: 11, color: "#7b8999" }}>운영요원 데모: operator@kmu.ac.kr / demo-operator</div>
  </form>;
}
