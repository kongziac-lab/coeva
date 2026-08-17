import { desc, eq } from "drizzle-orm";
import { AdminShell } from "@/components/admin-shell";
import { admins, auditLogs } from "@/db/schema";
import { getDb } from "@/lib/db";

export default async function AuditPage() {
  let rows: Array<{id:string;createdAt:Date;actor:string|null;action:string;entityType:string;entityId:string|null;detail:unknown}> = [];
  try { rows = await getDb().select({id:auditLogs.id,createdAt:auditLogs.createdAt,actor:admins.email,action:auditLogs.action,entityType:auditLogs.entityType,entityId:auditLogs.entityId,detail:auditLogs.detail}).from(auditLogs).leftJoin(admins,eq(auditLogs.actorId,admins.id)).orderBy(desc(auditLogs.createdAt)).limit(200); } catch { /* Show empty state. */ }
  return <AdminShell active="/admin/audit" title="감사 로그"><div className="content"><div className="page-head"><div><h1>감사 로그</h1><p>실제 시스템 작업 이력만 표시합니다.</p></div></div><section className="card table-card"><table className="data-table"><thead><tr><th>시간</th><th>사용자</th><th>작업</th><th>대상</th><th>상세</th></tr></thead><tbody>{rows.map(row=><tr key={row.id}><td>{row.createdAt.toLocaleString("ko-KR",{timeZone:"Asia/Seoul"})}</td><td>{row.actor??"시스템"}</td><td>{row.action}</td><td>{row.entityType}{row.entityId?` · ${row.entityId}`:""}</td><td>{row.detail?JSON.stringify(row.detail):"-"}</td></tr>)}{rows.length===0&&<tr><td colSpan={5} style={{textAlign:"center",padding:36,color:'#5b6b84'}}>기록된 작업 이력이 없습니다.</td></tr>}</tbody></table></section></div></AdminShell>;
}
