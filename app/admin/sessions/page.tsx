import { asc, eq } from "drizzle-orm";
import { AdminShell } from "@/components/admin-shell";
import { SessionOperatorPanel, SessionClass } from "@/components/session-operator-panel";
import { classes, evaluationSessions, instructors, teachingAssignments } from "@/db/schema";
import { getDb } from "@/lib/db";

export default async function SessionsPage() {
  let sessionClasses: SessionClass[] = [];
  try {
    const db = getDb();
    const [classRows, assignmentRows, activeRows] = await Promise.all([
      db.select().from(classes).orderBy(asc(classes.scheduledAt)),
      db.select({classId:teachingAssignments.classId,name:instructors.name}).from(teachingAssignments).innerJoin(instructors,eq(teachingAssignments.instructorId,instructors.id)).orderBy(asc(teachingAssignments.position)),
      db.select({id:evaluationSessions.id,classId:evaluationSessions.classId,status:evaluationSessions.status,target:evaluationSessions.targetCount}).from(evaluationSessions).where(eq(evaluationSessions.status,"ACTIVE")),
    ]);
    const sortedClassRows = [...classRows].sort((a, b) => {
      const classNumber = (value: string) => Number(String(value).match(/\d+/)?.[0] ?? Number.MAX_SAFE_INTEGER);
      return classNumber(a.code) - classNumber(b.code) || a.scheduledAt.getTime() - b.scheduledAt.getTime();
    });
    sessionClasses = sortedClassRows.map(row => {
      const active = activeRows.find(item => item.classId === row.id);
      const formatter = new Intl.DateTimeFormat("ko-KR", { timeZone:"Asia/Seoul", hour:"2-digit", minute:"2-digit", hour12:false });
      return { id:row.id, room:row.room, classCode:String(row.code), time:`${formatter.format(row.scheduledAt)}–${formatter.format(row.scheduledEndAt)}`, instructors:assignmentRows.filter(item=>item.classId===row.id).map(item=>item.name), target:active?.target??row.eligibleCount, submitted:0, status:active?"ACTIVE":"READY", sessionId:active?.id??null };
    });
  } catch { /* Show empty state. */ }
  return <AdminShell active="/admin/sessions" title="현장 평가"><div className="content"><div className="page-head"><div><h1>현장 평가 운영</h1><p>조사할 반을 선택하고 대상 인원을 입력한 뒤 임시 QR을 생성하세요.</p></div></div>{sessionClasses.length>0?<SessionOperatorPanel classes={sessionClasses}/>:<section className="card" style={{padding:36,textAlign:"center",color:'#65758a'}}>등록된 평가 일정이 없습니다. 시스템 관리자가 먼저 엑셀 일정을 가져와야 합니다.</section>}</div></AdminShell>;
}
