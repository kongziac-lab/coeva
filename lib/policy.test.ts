import { describe, expect, it } from "vitest";
import { calculateInstructorScore, evaluatePolicy } from "./policy";

describe("강의평가 규정 엔진", () => {
  it("참여율 50% 미만은 보류하고 정확히 50%는 판정한다", () => {
    expect(evaluatePolicy({ rawScore: 4.5, responseCount: 4999, eligibleOpportunities: 10000 }).status).toBe("INSUFFICIENT");
    expect(evaluatePolicy({ rawScore: 4.5, responseCount: 5, eligibleOpportunities: 10 }).status).toBe("NORMAL");
  });
  it("참여율 50% 미만이면 점수가 높아도 판정보류한다", () => {
    const decision = evaluatePolicy({ rawScore: 4.9, responseCount: 4, eligibleOpportunities: 10 });
    expect(decision.status).toBe("INSUFFICIENT");
    expect(decision.participationRate).toBe(0.4);
    expect(decision.reason).toContain("50%");
  });
  it.each([[3.67, "RESTRICTION"], [3.671, "WARNING"], [3.999, "WARNING"], [4, "NORMAL"]] as const)("점수 %s 경계를 판정한다", (score, status) => {
    expect(evaluatePolicy({ rawScore: score, responseCount: 10, eligibleOpportunities: 10 }).status).toBe(status);
  });
  it("경고가 연속되면 제한하고 정상 점수는 해제한다", () => {
    expect(evaluatePolicy({ rawScore: 3.8, responseCount: 10, eligibleOpportunities: 10, previousEvaluatedStatus: "WARNING" }).status).toBe("RESTRICTION");
    expect(evaluatePolicy({ rawScore: 4, responseCount: 10, eligibleOpportunities: 10, previousEvaluatedStatus: "WARNING" }).status).toBe("NORMAL");
  });
  it("모든 학생과 문항을 동일 가중 평균한다", () => {
    expect(calculateInstructorScore([[5, 5, 5, 5, 5, 5, 5], [3, 3, 3, 3, 3, 3, 3]])).toBe(4);
  });
});
