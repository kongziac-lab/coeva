"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm({ returnTo }: { returnTo: string }) {
  const [email,setEmail]=useState("admin@kmu.ac.kr"), [password,setPassword]=useState("demo-admin"), [error,setError]=useState(""); const [loading,setLoading]=useState(false); const router=useRouter();
  async function submit(e:React.FormEvent){e.preventDefault();setLoading(true);setError("");const res=await fetch("/api/auth/login",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email,password})});if(!res.ok){setError("이메일 또는 비밀번호를 확인해 주세요.");setLoading(false);return;}router.push(returnTo.startsWith("/")?returnTo:"/admin");router.refresh();}
  return <form onSubmit={submit}><div className="field"><label htmlFor="email">이메일</label><input id="email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></div><div className="field"><label htmlFor="password">비밀번호</label><input id="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required/></div>{error&&<div className="error">{error}</div>}<button className="btn btn-primary" disabled={loading}>{loading?"확인 중…":"로그인"}</button><div style={{marginTop:14,textAlign:'center',fontSize:11,color:'#7b8999'}}>초기 데모 계정이 입력되어 있습니다. 운영 배포 전 반드시 변경하세요.</div></form>;
}
