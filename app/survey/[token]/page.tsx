import { notFound } from "next/navigation";
import { SurveyForm } from "@/components/survey-form";
import { SurveyGateScreen } from "@/components/survey-gate";
import { getSurveyGate, getSurveyPayload } from "@/lib/survey-session";

export const dynamic = "force-dynamic";

export default async function SurveyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const data = await getSurveyPayload(token);
  if (data) return <SurveyForm classCode={data.classCode} room={data.room} instructors={data.instructors} token={token} />;
  // 인쇄한 QR 카드를 열기 전에 스캔했거나, 이미 마감된 QR이면 안내 화면을 보여 준다.
  const gate = await getSurveyGate(token);
  if (!gate) notFound();
  return <SurveyGateScreen token={token} state={gate.state} classCode={gate.classCode} room={gate.room} />;
}
