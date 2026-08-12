export const dashboardStats = {
  classes: 76,
  instructors: 94,
  completed: 61,
  responses: 1248,
  participationRate: 78.4,
};

export const liveClasses = [
  { room: "134", classCode: "1반", time: "10:00–10:05", instructors: ["정재영", "안혜진"], target: 18, submitted: 16, status: "ACTIVE" },
  { room: "135", classCode: "2반", time: "10:05–10:10", instructors: ["황란아", "박지영"], target: 17, submitted: 12, status: "ACTIVE" },
  { room: "204", classCode: "3반", time: "10:10–10:15", instructors: ["윤효진", "장슬기"], target: 19, submitted: 0, status: "READY" },
  { room: "205", classCode: "4반", time: "10:15–10:20", instructors: ["김민정", "김성진"], target: 16, submitted: 0, status: "READY" },
];

export const instructorResults = [
  { name: "정재영", classes: 2, responses: 31, eligible: 36, score: 4.62, previous: 4.48, status: "NORMAL", spark: [4.31, 4.4, 4.48, 4.62] },
  { name: "안혜진", classes: 2, responses: 29, eligible: 36, score: 3.84, previous: 4.12, status: "WARNING", spark: [4.22, 4.15, 4.12, 3.84] },
  { name: "황란아", classes: 1, responses: 12, eligible: 17, score: 3.58, previous: 4.05, status: "RESTRICTION", spark: [4.18, 4.1, 4.05, 3.58] },
  { name: "박지영", classes: 3, responses: 41, eligible: 52, score: 3.91, previous: 3.86, status: "RESTRICTION", spark: [4.17, 4.02, 3.86, 3.91] },
  { name: "윤효진", classes: 2, responses: 14, eligible: 37, score: 4.31, previous: 4.25, status: "INSUFFICIENT", spark: [4.11, 4.19, 4.25, 4.31] },
];

export const surveyQuestions = [
  "수업을 충실하게 준비하고 체계적으로 진행했다.",
  "학습자 수준에 맞게 명확하게 설명했다.",
  "학생이 수업에 참여하고 상호작용할 기회를 제공했다.",
  "학습에 도움이 되는 피드백을 제공했다.",
  "교재와 수업 자료를 효과적으로 활용했다.",
  "수업 시간과 진행 속도를 적절하게 운영했다.",
  "이 강사의 수업에 전반적으로 만족한다.",
];

export const surveyInstructors = ["정재영", "안혜진"];
