import { describe, expect, it } from "vitest";
import { SESSION_OPEN_MINUTES, isSessionOpen, sessionDeadline } from "./session-window";

describe("evaluation session auto-close", () => {
  it("sets the deadline 15 minutes after the start", () => {
    const start = new Date("2026-11-20T10:00:00+09:00");
    expect(SESSION_OPEN_MINUTES).toBe(15);
    expect(sessionDeadline(start).toISOString()).toBe(new Date("2026-11-20T10:15:00+09:00").toISOString());
  });

  it("treats an active session as closed once the deadline passes", () => {
    const expiresAt = new Date("2026-11-20T10:15:00+09:00");
    expect(isSessionOpen({ status: "ACTIVE", expiresAt }, expiresAt.getTime() - 1)).toBe(true);
    expect(isSessionOpen({ status: "ACTIVE", expiresAt }, expiresAt.getTime())).toBe(false);
    expect(isSessionOpen({ status: "CLOSED", expiresAt }, expiresAt.getTime() - 60_000)).toBe(false);
  });

  it("keeps legacy sessions without a deadline open until closed manually", () => {
    expect(isSessionOpen({ status: "ACTIVE", expiresAt: null })).toBe(true);
  });
});
