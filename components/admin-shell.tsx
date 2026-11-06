import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3, BookOpenCheck, CalendarRange, ClipboardList, ContactRound, FileSpreadsheet, LayoutDashboard, LogOut, QrCode, Settings, ShieldCheck, Users } from "lucide-react";
import { getAdminSession } from "@/lib/auth";
import { getActiveTerm } from "@/lib/terms";

const nav = [
  { href: "/admin", label: "운영 현황", icon: LayoutDashboard, roles: ["SYSTEM_ADMIN", "RESULTS_ADMIN"] },
  { href: "/admin/sessions", label: "현장 평가", icon: QrCode, roles: ["SYSTEM_ADMIN", "SURVEY_OPERATOR"] },
  { href: "/admin/results", label: "평가 결과", icon: BarChart3, roles: ["SYSTEM_ADMIN", "RESULTS_ADMIN"] },
  { href: "/admin/import", label: "일정 가져오기", icon: FileSpreadsheet, roles: ["SYSTEM_ADMIN"] },
  { href: "/admin/questionnaire", label: "설문 관리", icon: ClipboardList, roles: ["SYSTEM_ADMIN"] },
  { href: "/admin/instructors", label: "강사 사진 관리", icon: ContactRound, roles: ["SYSTEM_ADMIN"] },
];

export async function AdminShell({ children, active = "/admin", title = "운영 현황" }: { children: React.ReactNode; active?: string; title?: string }) {
  const session = await getAdminSession();
  if (!session) redirect(`/login?returnTo=${encodeURIComponent(active)}`);
  if (session.role === "SURVEY_OPERATOR" && active !== "/admin/sessions") redirect("/admin/sessions");

  const role = session.role;
  const visibleNav = nav.filter((item) => item.roles.includes(role));
  const isSystemAdmin = role === "SYSTEM_ADMIN";
  let activeTermName: string | null = null;
  try { activeTermName = (await getActiveTerm())?.name ?? null; } catch { /* Keep navigation available during database maintenance. */ }

  const roleLabel = role === "SURVEY_OPERATOR" ? "현장 운영요원" : role === "RESULTS_ADMIN" ? "결과 관리자" : "시스템 관리자";
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">K</div><div><strong>K-강의평가</strong><small>한국어학당</small></div></div>
      <div className="nav-label">평가 운영</div>
      <nav>{visibleNav.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={`nav-item ${active === href ? "active" : ""}`}><Icon size={18} />{label}</Link>)}</nav>
      {isSystemAdmin && <><div className="nav-label">시스템</div><Link href="/admin/terms" className={`nav-item ${active === "/admin/terms" ? "active" : ""}`}><CalendarRange size={18} />학기 관리</Link><Link href="/admin/users" className={`nav-item ${active === "/admin/users" ? "active" : ""}`}><Users size={18} />관리자 관리</Link><Link href="/admin/audit" className={`nav-item ${active === "/admin/audit" ? "active" : ""}`}><ShieldCheck size={18} />감사 로그</Link><Link href="/admin/settings" className={`nav-item ${active === "/admin/settings" ? "active" : ""}`}><Settings size={18} />환경 설정</Link></>}
      <div className="sidebar-foot"><div className="avatar">{session.name?.slice(0, 1) ?? "관"}</div><div className="sidebar-user"><strong>{session.name ?? session.email}</strong><div>{roleLabel}</div></div><form action="/api/auth/logout" method="post"><button className="logout-button" type="submit" title="로그아웃" aria-label="로그아웃"><LogOut size={17} /></button></form></div>
    </aside>
    <main className="main"><header className="topbar"><div className="mobile-header"><div className="brand-mark mobile-brand-mark">K</div>K-강의평가</div><div className="breadcrumb"><BookOpenCheck size={15} />강의평가 운영 / {title}</div><div className="top-actions">{isSystemAdmin ? <Link href="/admin/terms" className="term-select term-badge" title="학기 관리">{activeTermName ?? "운영 학기 없음"}</Link> : <span className="term-select term-badge">{activeTermName ?? "운영 학기 없음"}</span>}<div className="avatar">{session.name?.slice(0, 1) ?? "관"}</div><form action="/api/auth/logout" method="post"><button className="logout-button top-logout" type="submit" title="로그아웃" aria-label="로그아웃"><LogOut size={17} /></button></form></div></header>{children}</main>
  </div>;
}
