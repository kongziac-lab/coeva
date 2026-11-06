import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { and, eq, inArray, notInArray } from "drizzle-orm";
import { anonymousResponses, auditLogs, classes, instructors, teachingAssignments } from "@/db/schema";
import { getAdminSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getActiveTerm } from "@/lib/terms";
import { ScheduleSheetError, readScheduleSheet } from "@/lib/schedule-sheet";

type ImportError = Error & { code?: string };

class ScheduleValidationError extends Error {}

function partsFromDate(value: unknown, defaultYear = new Date().getFullYear()) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return { year: value.getUTCFullYear(), month: value.getUTCMonth() + 1, day: value.getUTCDate() };
  }
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) return { year: parsed.y, month: parsed.m, day: parsed.d };
  }
  const match = String(value ?? "").trim().match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
  if (match) return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
  const koreanMatch = String(value ?? "").trim().match(/^(?:(\d{4})\s*[년.\/-]\s*)?(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
  if (koreanMatch) return { year: Number(koreanMatch[1] ?? defaultYear), month: Number(koreanMatch[2]), day: Number(koreanMatch[3]) };
  const shortMatch = String(value ?? "").trim().match(/^(?:(\d{4})[./-])?(\d{1,2})[./-](\d{1,2})/);
  if (shortMatch) return { year: Number(shortMatch[1] ?? defaultYear), month: Number(shortMatch[2]), day: Number(shortMatch[3]) };
  return null;
}

function partsFromTime(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return { hour: value.getUTCHours(), minute: value.getUTCMinutes() };
  }
  if (typeof value === "number") {
    const totalMinutes = Math.round((value % 1) * 24 * 60);
    return { hour: Math.floor(totalMinutes / 60) % 24, minute: totalMinutes % 60 };
  }
  const match = String(value ?? "").trim().match(/^(\d{1,2}):(\d{2})/);
  if (match) return { hour: Number(match[1]), minute: Number(match[2]) };
  return null;
}

function koreaDateTime(dateValue: unknown, timeValue: unknown, defaultYear?: number) {
  const date = partsFromDate(dateValue, defaultYear);
  const time = partsFromTime(timeValue);
  if (!date || !time || time.hour > 23 || time.minute > 59) return null;
  const pad = (value: number) => String(value).padStart(2, "0");
  return new Date(`${date.year}-${pad(date.month)}-${pad(date.day)}T${pad(time.hour)}:${pad(time.minute)}:00+09:00`);
}

function failure(error: unknown) {
  if (error instanceof ScheduleValidationError || error instanceof ScheduleSheetError) {
    return NextResponse.json({ error: "invalid_schedule", message: error.message }, { status: 400 });
  }
  const databaseError = error as ImportError;
  console.error("Schedule import failed", {
    name: databaseError?.name,
    code: databaseError?.code,
    message: databaseError?.message,
  });
  if (["ECONNREFUSED", "ENOTFOUND", "ETIMEDOUT", "ECONNRESET", "42P01"].includes(databaseError?.code ?? "")) {
    return NextResponse.json({ error: "database_unavailable", message: "데이터베이스 연결 또는 초기화 상태를 확인해 주세요." }, { status: 503 });
  }
  return NextResponse.json({ error: "import_failed", message: "일정 저장 중 오류가 발생했습니다. 엑셀 내용을 확인해 주세요." }, { status: 500 });
}

export async function POST(request: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "unauthorized", message: "다시 로그인해 주세요." }, { status: 401 });

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "invalid_file", message: "5MB 이하의 엑셀 파일을 선택해 주세요." }, { status: 400 });
  }

  try {
    // Keep Excel serials for time cells. SheetJS can turn time-only cells into
    // timezone-shifted Date objects when cellDates is enabled.
    const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: false });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!sheet) return NextResponse.json({ error: "empty_file", message: "첫 번째 시트가 비어 있습니다." }, { status: 400 });
    const raw = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null });
    const titleYear = String(raw[0]?.[0] ?? "").match(/(20\d{2})\s*학년도/);
    const defaultYear = titleYear ? Number(titleYear[1]) : new Date().getFullYear();
    const sheetData = readScheduleSheet(raw);

    // 일자·시작·종료시간은 선택 항목이다. 비어 있으면 저장하지 않고, 적혀 있으면 형식을 확인한다.
    const rows = sheetData.rows.map((row) => {
      const hasTime = Boolean(String(row.start ?? "").trim() || String(row.end ?? "").trim());
      const scheduledAt = hasTime ? koreaDateTime(row.date, row.start, defaultYear) : null;
      const scheduledEndAt = hasTime ? koreaDateTime(row.date, row.end, defaultYear) : null;
      if (hasTime && (!scheduledAt || !scheduledEndAt || scheduledEndAt <= scheduledAt)) {
        throw new ScheduleValidationError(`${row.line}행(${row.classCode}반)의 일자와 시간을 확인하거나, 시간 칸을 비워 주세요.`);
      }
      return { classCode: row.classCode, room: row.room, scheduledAt, scheduledEndAt, instructorNames: row.instructors, eligibleCount: row.target };
    });

    const db = getDb();
    const term = await getActiveTerm(db);
    if (!term) return NextResponse.json({ error: "no_active_term", message: "운영 학기가 없습니다. 학기 관리에서 먼저 학기를 만들어 주세요." }, { status: 409 });

    await db.transaction(async (tx) => {
      for (const row of rows) {
        const [classRow] = await tx.insert(classes).values({
          termId: term.id,
          code: row.classCode,
          room: row.room,
          scheduledAt: row.scheduledAt,
          scheduledEndAt: row.scheduledEndAt,
          eligibleCount: row.eligibleCount,
        }).onConflictDoUpdate({
          target: [classes.termId, classes.code],
          set: { room: row.room, scheduledAt: row.scheduledAt, scheduledEndAt: row.scheduledEndAt, eligibleCount: row.eligibleCount },
        }).returning();

        const instructorIds: string[] = [];
        for (const [position, name] of row.instructorNames.entries()) {
          let [instructor] = await tx.select().from(instructors).where(eq(instructors.name, name)).limit(1);
          if (!instructor) [instructor] = await tx.insert(instructors).values({ name }).returning();
          instructorIds.push(instructor.id);
          await tx.insert(teachingAssignments).values({ classId: classRow.id, instructorId: instructor.id, position: position + 1 })
            .onConflictDoUpdate({ target: [teachingAssignments.classId, teachingAssignments.instructorId], set: { position: position + 1 } });
        }
        // 다시 가져온 엑셀에서 빠진 강사 배정은 지운다. 이미 응답이 있는 배정은 지울 수 없으므로 가져오기를 멈춘다.
        const removed = await tx.select({ id: teachingAssignments.id }).from(teachingAssignments)
          .where(and(eq(teachingAssignments.classId, classRow.id), notInArray(teachingAssignments.instructorId, instructorIds)));
        if (removed.length) {
          const removedIds = removed.map((item) => item.id);
          const [answered] = await tx.select({ id: anonymousResponses.id }).from(anonymousResponses).where(inArray(anonymousResponses.assignmentId, removedIds)).limit(1);
          if (answered) throw new ScheduleValidationError(`${row.classCode}반은 이미 평가 응답이 있어 강사 배정을 바꿀 수 없습니다.`);
          await tx.delete(teachingAssignments).where(inArray(teachingAssignments.id, removedIds));
        }
      }
      await tx.insert(auditLogs).values({ action: "SCHEDULE_IMPORT", entityType: "term", entityId: term.id, detail: { filename: file.name, classes: rows.length, actor: admin.email } });
    });
    return NextResponse.json({ ok: true, classes: rows.length, term: term.name });
  } catch (error) {
    return failure(error);
  }
}
