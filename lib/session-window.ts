// 평가는 시작(또는 다시 열기) 후 15분이 지나면 자동으로 닫힌다.
// 15분 안에 "평가 시작"을 누른 학생은 자동 마감 뒤 10분 동안 제출을 마칠 수 있다.
export const SESSION_OPEN_MINUTES = 15;
export const SUBMIT_GRACE_MINUTES = 10;

export const sessionDeadline = (from = new Date()) => new Date(from.getTime() + SESSION_OPEN_MINUTES * 60_000);
export const graceDeadline = (expiresAt: Date) => new Date(expiresAt.getTime() + SUBMIT_GRACE_MINUTES * 60_000);

type SessionTiming = { status: string; expiresAt: Date | null; closedAt?: Date | null };

// 새 학생이 들어와 평가를 시작할 수 있는가.
export function isSessionOpen(session: SessionTiming, now = Date.now()) {
  return session.status === "ACTIVE" && (!session.expiresAt || session.expiresAt.getTime() > now);
}

// 마감 전에 시작한 학생이 아직 제출할 수 있는 유예 시간인가.
// 15분이 지나 자동으로 닫힌 경우만 해당하고, 운영요원이 직접 종료·리셋한 경우는 바로 끝난다.
export function isInSubmitGrace(session: SessionTiming, now = Date.now()) {
  if (!session.expiresAt) return false;
  const expires = session.expiresAt.getTime();
  if (now < expires || now >= graceDeadline(session.expiresAt).getTime()) return false;
  if (session.status === "ACTIVE") return true;
  return session.status === "CLOSED" && Boolean(session.closedAt) && Math.abs(session.closedAt!.getTime() - expires) < 1000;
}
