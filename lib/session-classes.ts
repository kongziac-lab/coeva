import { asc, eq } from "drizzle-orm";
import { classes, instructors, teachingAssignments } from "@/db/schema";
import { getDb } from "@/lib/db";
import { getSessionSnapshots } from "@/lib/session-monitor";
import { getActiveTerm } from "@/lib/terms";

export type SessionPhase = "READY" | "ACTIVE" | "CLOSED";

export type SessionClass = {
  id: string;
  room: string;
  classCode: string;
  time: string;
  instructors: string[];
  target: number;
  connected: number;
  submitted: number;
  remaining: number;
  status: string;
  phase: SessionPhase;
  sessionId: string | null;
  url: string | null;
  expiresAt: string | null;
  reopenable: boolean;
};

const classNumber = (value: string) => Number(String(value).match(/\d+/)?.[0] ?? Number.MAX_SAFE_INTEGER);

// 현장 평가 화면과 순회 모드가 함께 쓰는 운영 학기 반 목록.
export async function loadSessionClasses(): Promise<{ termName: string | null; classes: SessionClass[] }> {
  const db = getDb();
  const term = await getActiveTerm(db);
  if (!term) return { termName: null, classes: [] };
  const [classRows, assignmentRows, snapshots] = await Promise.all([
    db.select().from(classes).where(eq(classes.termId, term.id)).orderBy(asc(classes.code)),
    db.select({ classId: teachingAssignments.classId, name: instructors.name }).from(teachingAssignments)
      .innerJoin(instructors, eq(teachingAssignments.instructorId, instructors.id))
      .innerJoin(classes, eq(teachingAssignments.classId, classes.id))
      .where(eq(classes.termId, term.id)).orderBy(asc(teachingAssignments.position)),
    getSessionSnapshots(undefined, term.id),
  ]);
  const formatter = new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit", hour12: false });
  const sorted = [...classRows].sort((a, b) => classNumber(a.code) - classNumber(b.code) || a.code.localeCompare(b.code, "ko") || (a.scheduledAt?.getTime() ?? 0) - (b.scheduledAt?.getTime() ?? 0));
  return {
    termName: term.name,
    classes: sorted.map((row) => {
      const snapshot = snapshots.find((item) => item.classId === row.id);
      return {
        id: row.id,
        room: row.room,
        classCode: String(row.code),
        time: row.scheduledAt && row.scheduledEndAt ? `${formatter.format(row.scheduledAt)}–${formatter.format(row.scheduledEndAt)}` : "",
        instructors: assignmentRows.filter((item) => item.classId === row.id).map((item) => item.name),
        target: snapshot?.targetCount ?? row.eligibleCount,
        connected: snapshot?.connected ?? 0,
        submitted: snapshot?.completed ?? 0,
        remaining: snapshot?.remaining ?? row.eligibleCount,
        status: snapshot?.status ?? "READY",
        phase: snapshot?.phase ?? "READY",
        sessionId: snapshot?.sessionId ?? null,
        url: snapshot?.url ?? null,
        expiresAt: snapshot?.expiresAt ?? null,
        reopenable: snapshot?.reopenable ?? false,
      };
    }),
  };
}
