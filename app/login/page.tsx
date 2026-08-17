import { LoginForm } from "@/components/login-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ returnTo?: string; error?: string; mfa?: string }> }) {
  const { returnTo, error, mfa } = await searchParams;
  return <main className="login-page"><div className="login-card"><div className="brand"><div className="brand-mark">K</div><div><strong style={{color:'#0d3168'}}>K-강의평가</strong><small style={{color:'#5b6b84'}}>한국어학당 관리자</small></div></div><h1>관리자 로그인</h1><p>승인된 담당자만 운영 화면에 접근할 수 있습니다.</p>{error && <div className="error" role="alert" style={{ marginBottom: 14 }}>{error}</div>}<LoginForm returnTo={returnTo ?? "/admin"} mfaRequired={mfa === "1"}/></div></main>;
}
