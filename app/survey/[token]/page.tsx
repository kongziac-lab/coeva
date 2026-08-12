import { notFound } from "next/navigation";
import { SurveyForm } from "@/components/survey-form";

export default async function SurveyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const base = process.env.APP_URL ?? "http://localhost:3000";
  try {
    const response = await fetch(`${base}/api/survey/${encodeURIComponent(token)}`, { cache: "no-store" });
    if (!response.ok) notFound();
    const data = await response.json() as { classCode: string; room: string; instructors: string[]; assignments: { assignmentId: string }[] };
    return <SurveyForm classCode={data.classCode} room={data.room} instructors={data.instructors} token={token} assignmentIds={data.assignments.map(a=>a.assignmentId)}/>;
  } catch { notFound(); }
}
