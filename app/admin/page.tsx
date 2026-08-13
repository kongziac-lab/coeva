import Link from "next/link";
import { Activity, BookOpen, CheckCircle2, QrCode, Users } from "lucide-react";
import { count, eq } from "drizzle-orm";
import { AdminShell } from "@/components/admin-shell";
import { anonymousResponses, classes, evaluationSessions, instructors } from "@/db/schema";
import { getDb } from "@/lib/db";

export default async function AdminDashboard() {
  let values = { classes: 0, instructors: 0, completed: 0, responses: 0 };
  try {
    const db = getDb();
    const [[classCount], [instructorCount], [completedCount], [responseCount]] = await Promise.all([
      db.select({ value: count() }).from(classes),
      db.select({ value: count() }).from(instructors),
      db.select({ value: count() }).from(evaluationSessions).where(eq(evaluationSessions.status, "CLOSED")),
      db.select({ value: count() }).from(anonymousResponses).where(eq(anonymousResponses.valid, true)),
    ]);
    values = { classes: classCount.value, instructors: instructorCount.value, completed: completedCount.value, responses: responseCount.value };
  } catch { /* Empty dashboard while the database is unavailable. */ }
  const stats = [
    { label: "전체 평가 반", value: `${values.classes}개`, icon: BookOpen },
    { label: "평가 대상 강사", value: `${values.instructors}명`, icon: Users },
    { label: "완료된 평가 세션", value: `${values.completed}개`, icon: CheckCircle2 },
    { label: "유효 강사별 응답", value: `${values.responses}건`, icon: Activity },
  ];
  return <AdminShell><div className="content"><div className="page-head"><div><h1>평가 운영 현황</h1><p>등록된 일정과 실제 제출 데이터를 기준으로 표시합니다.</p></div><Link href="/admin/sessions" className="btn btn-primary"><QrCode size={17}/>현장 평가 열기</Link></div><section className="stat-grid">{stats.map(({label,value,icon:Icon})=><div className="card stat" key={label}><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-icon"><Icon size={19}/></div></div>)}</section><section className="card" style={{padding:28,textAlign:"center",color:"#65758a"}}>{values.classes === 0 ? <>등록된 평가 일정이 없습니다. <Link className="link" href="/admin/import">엑셀 일정을 가져오세요.</Link></> : <>강의실별 운영은 <Link className="link" href="/admin/sessions">현장 평가</Link>, 집계 결과는 <Link className="link" href="/admin/results">평가 결과</Link>에서 확인할 수 있습니다.</>}</section></div></AdminShell>;
}
