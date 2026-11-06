import { describe, expect, it } from "vitest";
import { SESSION_OPEN_MINUTES, SUBMIT_GRACE_MINUTES, isInSubmitGrace, isSessionOpen, sessionDeadline } from "./session-window";

const minute = 60_000;

describe("evaluation session auto-close", () => {
  it("sets the deadline 15 minutes after the start", () => {
    const start = new Date("2026-11-20T10:00:00+09:00");
    expect(SESSION_OPEN_MINUTES).toBe(15);
    expect(sessionDeadline(start).toISOString()).toBe(new Date("2026-11-20T10:15:00+09:00").toISOString());
  });

  it("treats an active session as closed for new students once the deadline passes", () => {
    const expiresAt = new Date("2026-11-20T10:15:00+09:00");
    expect(isSessionOpen({ status: "ACTIVE", expiresAt }, expiresAt.getTime() - 1)).toBe(true);
    expect(isSessionOpen({ status: "ACTIVE", expiresAt }, expiresAt.getTime())).toBe(false);
    expect(isSessionOpen({ status: "CLOSED", expiresAt }, expiresAt.getTime() - minute)).toBe(false);
  });

  it("keeps legacy sessions without a deadline open until closed manually", () => {
    expect(isSessionOpen({ status: "ACTIVE", expiresAt: null })).toBe(true);
    expect(isInSubmitGrace({ status: "ACTIVE", expiresAt: null })).toBe(false);
  });
});

describe("submit grace after auto-close", () => {
  const expiresAt = new Date("2026-11-20T10:15:00+09:00");
  const end = expiresAt.getTime() + SUBMIT_GRACE_MINUTES * minute;

  it("lasts 10 minutes after the automatic deadline", () => {
    expect(SUBMIT_GRACE_MINUTES).toBe(10);
    expect(isInSubmitGrace({ status: "ACTIVE", expiresAt }, expiresAt.getTime() - 1)).toBe(false);
    expect(isInSubmitGrace({ status: "ACTIVE", expiresAt }, expiresAt.getTime())).toBe(true);
    expect(isInSubmitGrace({ status: "CLOSED", expiresAt, closedAt: expiresAt }, end - 1)).toBe(true);
    expect(isInSubmitGrace({ status: "CLOSED", expiresAt, closedAt: expiresAt }, end)).toBe(false);
  });

  it("ends immediately when the operator closes or resets the class", () => {
    const closedEarly = new Date(expiresAt.getTime() - 5 * minute);
    const closedDuringGrace = new Date(expiresAt.getTime() + 2 * minute);
    expect(isInSubmitGrace({ status: "CLOSED", expiresAt, closedAt: closedEarly }, expiresAt.getTime() + minute)).toBe(false);
    expect(isInSubmitGrace({ status: "CLOSED", expiresAt, closedAt: closedDuringGrace }, expiresAt.getTime() + 3 * minute)).toBe(false);
  });
});
