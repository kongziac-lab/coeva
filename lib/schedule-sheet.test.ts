import { describe, expect, it } from "vitest";
import { readScheduleSheet } from "./schedule-sheet";

describe("schedule sheet reader", () => {
  it("reads the new seven-column template without dates or times", () => {
    const sheet = readScheduleSheet([
      ["강의평가 분반 명단"],
      ["분반", "강의실", "강사1", "강사2", "강사3", "강사4", "설문인원"],
      [134, 301, "김민지", "이서준", null, null, "15명"],
      [135, 302, "박지현", null, null, null, 12],
      [null, null, null, null, null, null, null],
    ]);
    expect(sheet.rows).toEqual([
      { line: 3, classCode: "134", room: "301", instructors: ["김민지", "이서준"], target: 15, date: null, start: null, end: null },
      { line: 4, classCode: "135", room: "302", instructors: ["박지현"], target: 12, date: null, start: null, end: null },
    ]);
  });

  it("still reads the previous ten-column template and carries the date down", () => {
    const sheet = readScheduleSheet([
      ["2026학년도 여름학기 강의평가 시간표"],
      ["일자", "시작시간", "종료시간", "분반", "강의실", "강사1", "강사2", "강사3", "강사4", "설문인원"],
      ["8월 5일(수)", 0.4166, 0.4201, 1, 134, "정재영", "안혜진", null, null, 14],
      [null, 0.4201, 0.4236, 2, 135, "황란아", null, null, null, 10],
    ]);
    expect(sheet.rows[1]).toMatchObject({ classCode: "2", room: "135", instructors: ["황란아"], target: 10, date: "8월 5일(수)", start: 0.4201 });
  });

  it("accepts the original export with 반 and numbered instructor headers", () => {
    const sheet = readScheduleSheet([
      ["일자", "시작시간", "종료시간", "반", "강의실", 1, 2, 3, 4],
      ["8월 5일(수)", 0.41, 0.42, 1, 134, "정재영", "안혜진", null, null],
    ]);
    expect(sheet.rows[0]).toMatchObject({ classCode: "1", room: "134", instructors: ["정재영", "안혜진"], target: 0 });
  });

  it("explains missing headers, missing instructors and duplicate classes", () => {
    expect(() => readScheduleSheet([["반 이름", "교실"], [1, 2]])).toThrow("머리글");
    expect(() => readScheduleSheet([["분반", "강의실", "강사1"], [134, 301, null]])).toThrow("134반");
    expect(() => readScheduleSheet([["분반", "강의실", "강사1"], [134, 301, "김"], [134, 302, "이"]])).toThrow("두 번 이상");
  });
});
