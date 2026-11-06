import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prepareClassCards } from "@/lib/session-cards";
import { getActiveTerm } from "@/lib/terms";

// 인쇄용 QR 카드 목록. 없는 반은 아직 열리지 않은 QR을 새로 만든다.
export async function POST(request: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const term = await getActiveTerm();
    if (!term) return NextResponse.json({ error: "no_active_term" }, { status: 409 });
    const cards = await prepareClassCards(term.id, new URL(request.url).origin);
    return NextResponse.json({ termName: term.name, cards }, { headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "service_unavailable" }, { status: 503 });
  }
}
