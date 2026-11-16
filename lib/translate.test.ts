import { describe, expect, it } from "vitest";
import { isMostlyKorean } from "./translate";

describe("isMostlyKorean", () => {
  it("treats Korean comments as already Korean", () => {
    expect(isMostlyKorean("선생님 수업이 재미있어요!")).toBe(true);
    expect(isMostlyKorean("수업이 정말 좋아요 😊 OK")).toBe(true);
  });

  it("sends other languages to translation", () => {
    expect(isMostlyKorean("Cô giáo dạy rất dễ hiểu.")).toBe(false);
    expect(isMostlyKorean("老师讲得很清楚，谢谢！")).toBe(false);
    expect(isMostlyKorean("先生の授業が好きです")).toBe(false);
    expect(isMostlyKorean("Багш маш сайн заадаг.")).toBe(false);
  });

  it("does not translate text with no letters", () => {
    expect(isMostlyKorean("👍👍 !!!")).toBe(true);
    expect(isMostlyKorean("10/10")).toBe(true);
  });
});
