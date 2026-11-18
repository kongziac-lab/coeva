import { calculateInstructorScore } from "./policy";

// 응답이 이보다 적은 반·강사는 문항별 점수와 응답별 내역을 보여 주지 않는다.
// 응답이 몇 건뿐이면 문항 평균이 사실상 한 학생의 답이 되어, 반·강사만으로 작성자를 짐작할 수 있기 때문이다.
export const DETAIL_MIN_RESPONSES = 5;

export type DetailAssignment = {
  assignmentId: string;
  classId: string;
  classCode: string;
  room: string;
  eligibleCount: number;
  instructorId: string;
  instructorName: string;
};

export type DetailResponse = { assignmentId: string; answers: unknown };

export type ScoreSummary = {
  responseCount: number;
  eligible: number;
  participationRate: number;
  score: number | null;
  // 문항별 평균. 응답이 DETAIL_MIN_RESPONSES 미만이면 null로 가린다.
  questionAverages: Array<number | null> | null;
};

export type ClassDetail = ScoreSummary & { assignmentId: string; classId: string; classCode: string; room: string; instructorId: string; instructorName: string };
export type InstructorDetail = ScoreSummary & { instructorId: string; instructorName: string; classCodes: string[] };
export type AnonymousRow = { classCode: string; instructorName: string; answers: Array<number | null> };

export type TermDetail = {
  questions: string[];
  overall: { responseCount: number; questionAverages: Array<number | null> };
  instructors: InstructorDetail[];
  classes: ClassDetail[];
  anonymousRows: AnonymousRow[];
};

const isScore = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 1 && value <= 5;

function answerList(raw: unknown, questionCount: number): Array<number | null> {
  const list = Array.isArray(raw) ? raw : [];
  return Array.from({ length: questionCount }, (_, index) => (isScore(list[index]) ? list[index] : null));
}

function questionAverages(answerSets: Array<Array<number | null>>, questionCount: number) {
  return Array.from({ length: questionCount }, (_, index) => {
    const values = answerSets.map((answers) => answers[index]).filter(isScore);
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
  });
}

function summarize(answerSets: Array<Array<number | null>>, eligible: number, questionCount: number): ScoreSummary {
  const responseCount = answerSets.length;
  return {
    responseCount,
    eligible,
    participationRate: eligible > 0 ? responseCount / eligible : 0,
    // 학기점수와 같은 방식(전체 문항 점수의 평균)으로 계산해 평가 결과 화면과 숫자를 맞춘다.
    score: calculateInstructorScore(answerSets.map((answers) => answers.filter(isScore))),
    questionAverages: responseCount >= DETAIL_MIN_RESPONSES ? questionAverages(answerSets, questionCount) : null,
  };
}

const byCode = (a: string, b: string) => a.localeCompare(b, "ko", { numeric: true });

// 강의 배정과 익명 응답으로 반별·강사별·문항별 집계를 만든다. DB 없이 테스트할 수 있도록 순수 함수로 둔다.
export function buildTermDetail(assignments: DetailAssignment[], responses: DetailResponse[], questions: string[]): TermDetail {
  const longestAnswer = responses.reduce((max, row) => Math.max(max, Array.isArray(row.answers) ? row.answers.length : 0), 0);
  const questionCount = Math.max(questions.length, longestAnswer);
  const labels = Array.from({ length: questionCount }, (_, index) => questions[index] ?? `문항 ${index + 1}`);

  const answersByAssignment = new Map<string, Array<Array<number | null>>>();
  const known = new Set(assignments.map((item) => item.assignmentId));
  for (const response of responses) {
    if (!known.has(response.assignmentId)) continue;
    const list = answersByAssignment.get(response.assignmentId) ?? [];
    list.push(answerList(response.answers, questionCount));
    answersByAssignment.set(response.assignmentId, list);
  }

  const classRows: ClassDetail[] = assignments
    .map((item) => ({
      assignmentId: item.assignmentId,
      classId: item.classId,
      classCode: item.classCode,
      room: item.room,
      instructorId: item.instructorId,
      instructorName: item.instructorName,
      ...summarize(answersByAssignment.get(item.assignmentId) ?? [], item.eligibleCount, questionCount),
    }))
    .sort((a, b) => byCode(a.classCode, b.classCode) || a.instructorName.localeCompare(b.instructorName, "ko"));

  const instructorGroups = new Map<string, { name: string; answers: Array<Array<number | null>>; eligible: number; classCodes: string[] }>();
  for (const item of assignments) {
    const group = instructorGroups.get(item.instructorId) ?? { name: item.instructorName, answers: [], eligible: 0, classCodes: [] };
    group.answers.push(...(answersByAssignment.get(item.assignmentId) ?? []));
    group.eligible += item.eligibleCount;
    if (!group.classCodes.includes(item.classCode)) group.classCodes.push(item.classCode);
    instructorGroups.set(item.instructorId, group);
  }
  const instructorRows: InstructorDetail[] = [...instructorGroups.entries()]
    .map(([instructorId, group]) => ({ instructorId, instructorName: group.name, classCodes: group.classCodes.sort(byCode), ...summarize(group.answers, group.eligible, questionCount) }))
    .sort((a, b) => a.instructorName.localeCompare(b.instructorName, "ko"));

  const allAnswers = [...answersByAssignment.values()].flat();

  // 응답별 내역은 응답이 충분한 반·강사만 싣고, 제출 순서가 드러나지 않도록 점수 순으로 정렬한다.
  const anonymousRows: AnonymousRow[] = classRows
    .filter((row) => row.responseCount >= DETAIL_MIN_RESPONSES)
    .flatMap((row) => [...(answersByAssignment.get(row.assignmentId) ?? [])]
      .sort((a, b) => a.map((v) => v ?? 0).join(",").localeCompare(b.map((v) => v ?? 0).join(",")))
      .map((answers) => ({ classCode: row.classCode, instructorName: row.instructorName, answers })));

  return {
    questions: labels,
    overall: { responseCount: allAnswers.length, questionAverages: questionAverages(allAnswers, questionCount) },
    instructors: instructorRows,
    classes: classRows,
    anonymousRows,
  };
}
