// 평가는 시작(또는 다시 열기) 후 15분이 지나면 자동으로 닫힌다.
export const SESSION_OPEN_MINUTES = 15;

export const sessionDeadline = (from = new Date()) => new Date(from.getTime() + SESSION_OPEN_MINUTES * 60_000);

export function isSessionOpen(session: { status: string; expiresAt: Date | null }, now = Date.now()) {
  return session.status === "ACTIVE" && (!session.expiresAt || session.expiresAt.getTime() > now);
}
