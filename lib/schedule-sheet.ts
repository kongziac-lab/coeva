// 강의평가 엑셀의 머리글을 이름으로 찾아 반 목록으로 바꾼다. 서버(가져오기)와 브라우저(미리보기)가 함께 쓴다.
// 필수: 분반(또는 반), 강의실, 강사1~4(또는 1~4). 선택: 설문인원, 일자, 시작시간, 종료시간.

export type ScheduleColumns = {
  classCode: number;
  room: number;
  instructors: number[];
  target: number | null;
  date: number | null;
  start: number | null;
  end: number | null;
};

export type ScheduleSheetRow = {
  line: number;
  classCode: string;
  room: string;
  instructors: string[];
  target: number;
  date: unknown;
  start: unknown;
  end: unknown;
};

export type ScheduleSheet = { columns: ScheduleColumns; rows: ScheduleSheetRow[] };

const normalize = (value: unknown) => String(value ?? "").replace(/\s+/g, "").trim();
const text = (value: unknown) => String(value ?? "").trim();

export function eligibleCountFromValue(value: unknown) {
  const match = String(value ?? "").replace(/,/g, "").match(/\d+/);
  return match ? Math.max(0, Number(match[0])) : 0;
}

function findColumns(header: unknown[]): ScheduleColumns | null {
  const names = header.map(normalize);
  const find = (...candidates: string[]) => {
    const index = names.findIndex((name) => candidates.includes(name));
    return index >= 0 ? index : null;
  };
  const classCode = find("분반", "반");
  const room = find("강의실");
  if (classCode === null || room === null) return null;
  const instructors = names
    .map((name, index) => ({ index, order: name.match(/^(?:강사)?([1-9])$/)?.[1] }))
    .filter((item): item is { index: number; order: string } => Boolean(item.order))
    .sort((a, b) => Number(a.order) - Number(b.order))
    .map((item) => item.index);
  const single = find("강사");
  if (!instructors.length && single !== null) instructors.push(single);
  if (!instructors.length) return null;
  return {
    classCode,
    room,
    instructors: instructors.slice(0, 4),
    target: find("설문인원", "인원", "대상인원", "학생수"),
    date: find("일자", "날짜"),
    start: find("시작시간", "시작"),
    end: find("종료시간", "종료"),
  };
}

export class ScheduleSheetError extends Error {}

export function readScheduleSheet(raw: unknown[][]): ScheduleSheet {
  const headerIndex = raw.slice(0, 10).findIndex((row) => Array.isArray(row) && findColumns(row) !== null);
  if (headerIndex < 0) throw new ScheduleSheetError("머리글(분반, 강의실, 강사1)을 찾을 수 없습니다. 강의평가 양식을 확인해 주세요.");
  const columns = findColumns(raw[headerIndex])!;
  let carriedDate: unknown = null;
  const rows: ScheduleSheetRow[] = [];
  raw.slice(headerIndex + 1).forEach((row, offset) => {
    if (!Array.isArray(row)) return;
    const line = headerIndex + offset + 2;
    if (columns.date !== null && text(row[columns.date])) carriedDate = row[columns.date];
    const classCode = text(row[columns.classCode]);
    if (!classCode) return;
    const room = text(row[columns.room]);
    const instructors = columns.instructors.map((index) => text(row[index])).filter(Boolean);
    if (!room || !instructors.length) throw new ScheduleSheetError(`${line}행(${classCode}반)의 강의실 또는 강사를 확인해 주세요.`);
    rows.push({
      line,
      classCode,
      room,
      instructors,
      target: columns.target === null ? 0 : eligibleCountFromValue(row[columns.target]),
      date: columns.date === null ? null : carriedDate,
      start: columns.start === null ? null : row[columns.start] ?? null,
      end: columns.end === null ? null : row[columns.end] ?? null,
    });
  });
  if (!rows.length) throw new ScheduleSheetError("가져올 분반이 없습니다.");
  const seen = new Set<string>();
  for (const row of rows) {
    if (seen.has(row.classCode)) throw new ScheduleSheetError(`${row.classCode}반이 엑셀에 두 번 이상 있습니다.`);
    seen.add(row.classCode);
  }
  return { columns, rows };
}
