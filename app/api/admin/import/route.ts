import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { eq } from "drizzle-orm";
import { auditLogs, classes, instructors, teachingAssignments, terms } from "@/db/schema";
import { getAdminSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

type ImportError = Error & { code?: string };

class ScheduleValidationError extends Error {}

function partsFromDate(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return { year: value.getUTCFullYear(), month: value.getUTCMonth() + 1, day: value.getUTCDate() };
  }
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) return { year: parsed.y, month: parsed.m, day: parsed.d };
  }
  const match = String(value ?? "").trim().match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
  if (match) return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
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

function koreaDateTime(dateValue: unknown, timeValue: unknown) {
  const date = partsFromDate(dateValue);
  const time = partsFromTime(timeValue);
  if (!date || !time || time.hour > 23 || time.minute > 59) return null;
  const pad = (value: number) => String(value).padStart(2, "0");
  return new Date(`${date.year}-${pad(date.month)}-${pad(date.day)}T${pad(time.hour)}:${pad(time.minute)}:00+09:00`);
}

function failure(error: unknown) {
  if (error instanceof ScheduleValidationError) {
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
  return NextResponse.json({ error: "import_failed", message: "일정 저장 중 오류가 발생했습니다. 엑셀의 날짜와 시간 형식을 확인해 주세요." }, { status: 500 });
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
    const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!sheet) return NextResponse.json({ error: "empty_file", message: "첫 번째 시트가 비어 있습니다." }, { status: 400 });
    const raw = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null });
    const sourceRows = raw.slice(1).filter((row) => Array.isArray(row) && row[3]);
    if (!sourceRows.length) return NextResponse.json({ error: "empty_file", message: "가져올 반 일정이 없습니다." }, { status: 400 });

    let carriedDate: unknown = null;
    const rows = sourceRows.map((row, index) => {
      if (row[0] !== null && String(row[0]).trim() !== "") carriedDate = row[0];
      const scheduledAt = koreaDateTime(carriedDate, row[1]);
      const scheduledEndAt = koreaDateTime(carriedDate, row[2]);
      const instructorNames = row.slice(5, 9).filter(Boolean).map((name) => String(name).trim()).filter(Boolean);
      if (!scheduledAt || !scheduledEndAt || scheduledEndAt <= scheduledAt || !String(row[4] ?? "").trim() || instructorNames.length < 1) {
        throw new ScheduleValidationError(`${index + 2}행의 일자, 시간, 강의실 또는 강사를 확인해 주세요.`);
      }
      return { classCode: String(row[3]).trim(), room: String(row[4]).trim(), scheduledAt, scheduledEndAt, instructorNames };
    });

    const db = getDb();
    let [term] = await db.select().from(terms).where(eq(terms.active, true)).limit(1);
    if (!term) {
      [term] = await db.insert(terms).values({
        code: "2026-SUMMER",
        name: "2026년 여름학기",
        startsAt: new Date("2026-06-01T00:00:00+09:00"),
        endsAt: new Date("2026-08-31T23:59:59+09:00"),
        active: true,
      }).returning();
    }

    await db.transaction(async (tx) => {
      for (const row of rows) {
        const [classRow] = await tx.insert(classes).values({
          termId: term.id,
          code: row.classCode,
          room: row.room,
          scheduledAt: row.scheduledAt,
          scheduledEndAt: row.scheduledEndAt,
        }).onConflictDoUpdate({
          target: [classes.termId, classes.code],
          set: { room: row.room, scheduledAt: row.scheduledAt, scheduledEndAt: row.scheduledEndAt },
        }).returning();

        for (const [position, name] of row.instructorNames.entries()) {
          let [instructor] = await tx.select().from(instructors).where(eq(instructors.name, name)).limit(1);
          if (!instructor) [instructor] = await tx.insert(instructors).values({ name }).returning();
          await tx.insert(teachingAssignments).values({ classId: classRow.id, instructorId: instructor.id, position: position + 1 }).onConflictDoNothing();
        }
      }
      await tx.insert(auditLogs).values({ action: "SCHEDULE_IMPORT", entityType: "term", entityId: term.id, detail: { filename: file.name, classes: rows.length, actor: admin.email } });
    });
    return NextResponse.json({ ok: true, classes: rows.length });
  } catch (error) {
    return failure(error);
  }
}
