export type KgasStudent = { externalId: string; displayName: string; classCode: string; attended: boolean };
export type KgasIdentity = { externalId: string; classCode: string };

export interface KgasAdapter {
  getAttendance(termCode: string, classCode: string, date: string): Promise<KgasStudent[]>;
  verifySignedIdentity(assertion: string): Promise<KgasIdentity>;
}

export class UnconfiguredKgasAdapter implements KgasAdapter {
  async getAttendance(): Promise<KgasStudent[]> { throw new Error("KGAS_INTERFACE_NOT_CONFIGURED"); }
  async verifySignedIdentity(): Promise<KgasIdentity> { throw new Error("KGAS_INTERFACE_NOT_CONFIGURED"); }
}

export function getKgasAdapter(): KgasAdapter {
  // KGAS API/SSO 명세가 확정되면 이 팩토리에 실제 어댑터를 연결한다.
  return new UnconfiguredKgasAdapter();
}
