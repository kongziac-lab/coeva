import Link from "next/link";
import { Activity, AlertTriangle, ArrowUpRight, BookOpen, CheckCircle2, QrCode, Users } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { dashboardStats, instructorResults, liveClasses } from "@/lib/demo-data";

const statusName = { NORMAL: "정상", WARNING: "1차 경고", RESTRICTION: "강의 제한", INSUFFICIENT: "판정 보류" } as const;

export default function AdminDashboard() {
  const stats = [
    { label:"전체 평가 반", value:`${dashboardStats.classes}개`, sub:"오전 33 · 오후 43", icon:BookOpen },
    { label:"평가 대상 강사", value:`${dashboardStats.instructors}명`, sub:"중복 배정 포함 164건", icon:Users },
    { label:"완료된 반", value:`${dashboardStats.completed} / ${dashboardStats.classes}`, sub:"현재 80.3% 진행", icon:CheckCircle2 },
    { label:"전체 참여율", value:`${dashboardStats.participationRate}%`, sub:`유효 응답 ${dashboardStats.responses.toLocaleString()}건`, icon:Activity },
  ];
  return <AdminShell>
    <div className="content">
      <div className="page-head"><div><h1>오늘의 평가 운영</h1><p>2026년 여름학기 · 8월 5일 수요일 현장 진행 현황입니다.</p></div><Link href="/admin/sessions" className="btn btn-primary"><QrCode size={17}/>현장 평가 열기</Link></div>
      <section className="stat-grid">{stats.map(({label,value,sub,icon:Icon})=><div className="card stat" key={label}><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-sub">{sub}</div><div className="stat-icon"><Icon size={19}/></div></div>)}</section>
      <section className="grid-2">
        <div className="card"><div className="panel-head"><h2>실시간 평가 현황</h2><Link className="link" href="/admin/sessions">전체 보기 <ArrowUpRight size={13}/></Link></div><div className="live-list">{liveClasses.map((row)=><div className="live-row" key={row.classCode}><div className="room">{row.room}</div><div className="live-main"><strong>{row.classCode} · {row.instructors.join(", ")}</strong><div className="live-meta">{row.time} · {row.status === "ACTIVE" ? "평가 진행 중" : "시작 대기"}</div></div><div className="progress-wrap"><div className="progress-text">{row.submitted} / {row.target}명</div><div className="progress"><i style={{width:`${row.target ? row.submitted / row.target * 100 : 0}%`}}/></div></div></div>)}</div></div>
        <div className="card"><div className="panel-head"><h2>확인할 알림</h2><span>3건</span></div><div className="notice-list"><div className="notice red"><div className="notice-dot"/><div><p><strong>강의 제한 대상 2명</strong><br/>규정 판정 결과를 확인해 주세요.</p><small>방금 전</small></div></div><div className="notice"><div className="notice-dot"/><div><p><strong>1차 경고 대상 1명</strong><br/>평가점수가 4.0 미만입니다.</p><small>7분 전</small></div></div><div className="notice"><div className="notice-dot" style={{background:'#8290a2'}}/><div><p><strong>참여율 미달 1명</strong><br/>50% 미만으로 판정이 보류되었습니다.</p><small>12분 전</small></div></div></div></div>
      </section>
      <section className="card table-card"><div className="panel-head"><h2>강사별 평가 요약</h2><div className="table-tools"><input className="search" placeholder="강사 이름 검색" aria-label="강사 이름 검색"/><Link href="/admin/results" className="btn btn-secondary">전체 결과</Link></div></div><table className="data-table"><thead><tr><th>강사</th><th>평가 반</th><th>응답 / 대상</th><th>참여율</th><th>학기점수</th><th>최근 추이</th><th>규정 상태</th></tr></thead><tbody>{instructorResults.map((r)=><tr key={r.name}><td><strong>{r.name}</strong></td><td>{r.classes}개 반</td><td>{r.responses} / {r.eligible}</td><td>{(r.responses/r.eligible*100).toFixed(1)}%</td><td><span className="score">{r.score.toFixed(2)}</span> / 5.00</td><td><span className="spark">▁▃▅▇</span></td><td><span className={`status ${r.status}`}>{statusName[r.status as keyof typeof statusName]}</span></td></tr>)}</tbody></table></section>
    </div>
  </AdminShell>;
}
