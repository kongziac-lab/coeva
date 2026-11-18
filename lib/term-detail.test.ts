import { describe, expect, it } from "vitest";
import { buildTermDetail, DETAIL_MIN_RESPONSES, type DetailAssignment } from "./term-detail";

const questions = ["Q1", "Q2", "Q3"];
const assignment = (assignmentId: string, classCode: string, instructorId: string, instructorName: string, eligibleCount: number): DetailAssignment => ({
  assignmentId, classId: `class-${classCode}`, classCode, room: "101", eligibleCount, instructorId, instructorName,
});
const repeat = (assignmentId: string, answers: number[], times: number) => Array.from({ length: times }, () => ({ assignmentId, answers }));

describe("반별·문항별 상세 집계", () => {
  const assignments = [
    assignment("a1", "10", "t1", "나강사", 10),
    assignment("a2", "2", "t1", "나강사", 8),
    assignment("a3", "2", "t2", "가강사", 8),
  ];
  const responses = [
    ...repeat("a1", [5, 4, 3], 5),
    ...repeat("a2", [3, 3, 3], 2),
    ...repeat("a3", [4, 4, 5], 6),
    { assignmentId: "other-term", answers: [1, 1, 1] },
  ];
  const detail = buildTermDetail(assignments, responses, questions);

  it("반은 분반 번호 순, 강사는 가나다순으로 정렬한다", () => {
    expect(detail.classes.map((row) => `${row.classCode}-${row.instructorName}`)).toEqual(["2-가강사", "2-나강사", "10-나강사"]);
    expect(detail.instructors.map((row) => row.instructorName)).toEqual(["가강사", "나강사"]);
  });

  it("반별 응답 수, 참여율, 문항 평균을 계산한다", () => {
    const row = detail.classes.find((item) => item.assignmentId === "a1")!;
    expect(row.responseCount).toBe(5);
    expect(row.participationRate).toBe(0.5);
    expect(row.score).toBe(4);
    expect(row.questionAverages).toEqual([5, 4, 3]);
  });

  it(`응답 ${DETAIL_MIN_RESPONSES}건 미만인 반은 문항 점수를 가린다`, () => {
    const row = detail.classes.find((item) => item.assignmentId === "a2")!;
    expect(row.responseCount).toBe(2);
    expect(row.score).toBe(3);
    expect(row.questionAverages).toBeNull();
  });

  it("강사별 집계는 모든 반을 합치고 학기점수와 같은 방식으로 계산한다", () => {
    const row = detail.instructors.find((item) => item.instructorId === "t1")!;
    expect(row.responseCount).toBe(7);
    expect(row.eligible).toBe(18);
    expect(row.classCodes).toEqual(["2", "10"]);
    expect(row.score).toBeCloseTo((5 * 12 + 2 * 9) / 21);
    expect(row.questionAverages).toEqual([(25 + 6) / 7, (20 + 6) / 7, 3]);
  });

  it("다른 학기 응답은 무시하고 학기 전체 문항 평균을 낸다", () => {
    expect(detail.overall.responseCount).toBe(13);
    expect(detail.overall.questionAverages[2]).toBeCloseTo((15 + 6 + 30) / 13);
  });

  it("응답별 내역은 응답이 충분한 반만 싣는다", () => {
    expect(detail.anonymousRows).toHaveLength(11);
    expect(new Set(detail.anonymousRows.map((row) => row.classCode))).toEqual(new Set(["2", "10"]));
    expect(detail.anonymousRows.some((row) => row.instructorName === "나강사" && row.classCode === "2")).toBe(false);
  });

  it("범위를 벗어난 점수는 빼고, 문항 수가 다른 응답도 처리한다", () => {
    const odd = buildTermDetail([assignment("x", "1", "t", "강사", 5)], [...repeat("x", [5, 5, 5], 4), { assignmentId: "x", answers: [9, 1, 1, 2] }], questions);
    expect(odd.questions).toEqual(["Q1", "Q2", "Q3", "문항 4"]);
    expect(odd.classes[0].questionAverages).toEqual([5, (20 + 1) / 5, (20 + 1) / 5, 2]);
  });
});
