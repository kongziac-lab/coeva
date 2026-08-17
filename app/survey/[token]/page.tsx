import { notFound } from "next/navigation";
import { SurveyForm } from "@/components/survey-form";
import { getSurveyPayload } from "@/lib/survey-session";

export const dynamic = "force-dynamic";

export default async function SurveyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const data = await getSurveyPayload(token);
  if (!data) notFound();
  return <SurveyForm classCode={data.classCode} room={data.room} instructors={data.instructors} token={token} />;
}
