import { asc, eq } from "drizzle-orm";
import { AdminShell } from "@/components/admin-shell";
import { SessionOperatorPanel, SessionClass } from "@/components/session-operator-panel";
import { classes, instructors, teachingAssignments } from "@/db/schema";
import { getDb } from "@/lib/db";
import { getSessionSnapshots } from "@/lib/session-monitor";

export default async function SessionsPage() {
  let sessionClasses: SessionClass[] = [];
  try {
    const db = getDb();
    const [classRows, assignmentRows, snapshots] = await Promise.all([
      db.select().from(classes).orderBy(asc(classes.scheduledAt)),
      db.select({classId:teachingAssignments.classId,name:instructors.name}).from(teachingAssignments).innerJoin(instructors,eq(teachingAssignments.instructorId,instructors.id)).orderBy(asc(teachingAssignments.position)),
      getSessionSnapshots(),
    ]);
    const sortedClassRows = [...classRows].sort((a, b) => {
      const classNumber = (value: string) => Number(String(value).match(/\d+/)?.[0] ?? Number.MAX_SAFE_INTEGER);
      return classNumber(a.code) - classNumber(b.code) || a.scheduledAt.getTime() - b.scheduledAt.getTime();
    });
    sessionClasses = sortedClassRows.map(row => {
      const snapshot = snapshots.find(item => item.classId === row.id);
      const formatter = new Intl.DateTimeFormat("ko-KR", { timeZone:"Asia/Seoul", hour:"2-digit", minute:"2-digit", hour12:false });
      return { id:row.id, room:row.room, classCode:String(row.code), time:`${formatter.format(row.scheduledAt)}–${formatter.format(row.scheduledEndAt)}`, instructors:assignmentRows.filter(item=>item.classId===row.id).map(item=>item.name), target:snapshot?.targetCount??row.eligibleCount, connected:snapshot?.connected??0, submitted:snapshot?.completed??0, remaining:snapshot?.remaining??row.eligibleCount, status:snapshot?.status??"READY", sessionId:snapshot?.sessionId??null, url:snapshot?.url??null };
    });
  } catch { /* Show empty state. */ }
  return <AdminShell active="/admin/sessions" title="현장 평가"><div className="content"><div className="page-head"><div><h1>현장 평가 운영</h1><p>조사할 반을 선택하고 대상 인원을 입력한 뒤 임시 QR을 생성하세요.</p></div></div>{sessionClasses.length>0?<SessionOperatorPanel classes={sessionClasses}/>:<section className="card" style={{padding:36,textAlign:"center",color:'#5b6b84'}}>등록된 평가 일정이 없습니다. 시스템 관리자가 먼저 엑셀 일정을 가져와야 합니다.</section>}</div></AdminShell>;
}
