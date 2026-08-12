export type PolicyStatus = "NORMAL" | "WARNING" | "RESTRICTION" | "INSUFFICIENT";

export type PolicyInput = {
  rawScore: number | null;
  responseCount: number;
  eligibleOpportunities: number;
  previousEvaluatedStatus?: PolicyStatus | null;
};

export type PolicyDecision = {
  status: PolicyStatus;
  participationRate: number;
  reason: string;
};

export function evaluatePolicy(input: PolicyInput): PolicyDecision {
  const participationRate = input.eligibleOpportunities > 0
    ? input.responseCount / input.eligibleOpportunities
    : 0;

  if (input.rawScore === null || participationRate < 0.5) {
    return { status: "INSUFFICIENT", participationRate, reason: "평가 참여율이 50% 미만이므로 판정을 보류합니다." };
  }
  if (input.rawScore <= 3.67) {
    return { status: "RESTRICTION", participationRate, reason: "평가점수가 3.67 이하이므로 다음 학기 강의 제한 대상입니다." };
  }
  if (input.rawScore < 4) {
    if (input.previousEvaluatedStatus === "WARNING") {
      return { status: "RESTRICTION", participationRate, reason: "평가받은 두 학기 연속 4.0 미만이므로 다음 학기 강의 제한 대상입니다." };
    }
    return { status: "WARNING", participationRate, reason: "평가점수가 4.0 미만이므로 1차 경고 대상입니다." };
  }
  return { status: "NORMAL", participationRate, reason: "평가점수가 4.0 이상으로 정상입니다." };
}

export function calculateInstructorScore(answerSets: number[][]): number | null {
  const scores = answerSets.flat().filter((score) => Number.isFinite(score) && score >= 1 && score <= 5);
  return scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : null;
}
