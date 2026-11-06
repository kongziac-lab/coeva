import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray, ne, or } from "drizzle-orm";
import { z } from "zod";
import { anonymousResponses, classes, evaluationSessions, participation, questionnaireVersions, teachingAssignments, instructors } from "@/db/schema";
import { getDb } from "@/lib/db";
import { hashSubject, hashToken } from "@/lib/security";
import { getSurveyPayload } from "@/lib/survey-session";
import { isSessionOpen } from "@/lib/session-window";

const answerSet = z.object({ assignmentId: z.uuid(), answers: z.array(z.number().int().min(1).max(5)).length(7), comment: z.string().max(1000).optional() });
const submission = z.object({ deviceId: z.string().min(16).max(128), language: z.string().max(12), responses: z.array(answerSet).min(1).max(4) });

async function findSession(token: string) {
  const db = getDb();
  const rows = await db.select({ id:evaluationSessions.id,status:evaluationSessions.status,expiresAt:evaluationSessions.expiresAt,classId:classes.id,termId:classes.termId,classCode:classes.code,room:classes.room,questionnaireId:questionnaireVersions.id,questions:questionnaireVersions.questions })
    .from(evaluationSessions).innerJoin(classes,eq(evaluationSessions.classId,classes.id)).innerJoin(questionnaireVersions,eq(evaluationSessions.questionnaireId,questionnaireVersions.id))
    .where(eq(evaluationSessions.tokenHash,hashToken(token))).limit(1);
  return rows[0];
}

type Db = ReturnType<typeof getDb>;
// 한 기기는 한 학기에 한 반만 평가할 수 있다. 같은 학기의 다른 세션(다른 반, 같은 반의 새 QR)에서
// 이미 제출한 기록이 있으면 막는다. 참여 기록은 세션별 해시로만 저장되므로 학기 안의 세션마다 해시를 다시 계산해 비교한다.
async function completedElsewhereInTerm(db: Db, termId: string, classId: string, sessionId: string, deviceId: string, kgasSubject: string | null): Promise<"same_class" | "other_class" | null> {
  const others = await db.select({ id: evaluationSessions.id, classId: evaluationSessions.classId }).from(evaluationSessions)
    .innerJoin(classes, eq(evaluationSessions.classId, classes.id))
    .where(and(eq(classes.termId, termId), ne(evaluationSessions.id, sessionId)));
  if (!others.length) return null;
  const deviceHashes = others.map((other) => hashSubject(deviceId, other.id));
  const subjectHashes = others.map((other) => hashSubject(kgasSubject ?? deviceId, other.id));
  const rows = await db.select({ sessionId: participation.sessionId }).from(participation)
    .where(and(inArray(participation.sessionId, others.map((other) => other.id)), eq(participation.status, "COMPLETED"), or(inArray(participation.deviceHash, deviceHashes), inArray(participation.subjectHash, subjectHashes))));
  if (!rows.length) return null;
  const classBySession = new Map(others.map((other) => [other.id, other.classId]));
  return rows.some((row) => classBySession.get(row.sessionId) === classId) ? "same_class" : "other_class";
}

const duplicateError = (kind: "same_class" | "other_class") => NextResponse.json({ error: kind === "same_class" ? "already_submitted" : "already_submitted_other_class" }, { status: 409 });

export async function GET(_: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const payload = await getSurveyPayload(token);
  if (!payload) return NextResponse.json({ error: "session_unavailable" }, { status: 410 });
  return NextResponse.json(payload, { headers: { "cache-control": "no-store" } });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token }=await params; const parsed=submission.safeParse(await request.json()); if(!parsed.success)return NextResponse.json({error:"invalid_submission"},{status:400});
    const session=await findSession(token); if(!session||!isSessionOpen(session))return NextResponse.json({error:"session_unavailable"},{status:410});
    const db=getDb(); const validAssignments=await db.select({id:teachingAssignments.id}).from(teachingAssignments).where(eq(teachingAssignments.classId,session.classId));
    const expected=new Set(validAssignments.map(a=>a.id)); if(parsed.data.responses.length!==expected.size||parsed.data.responses.some(r=>!expected.has(r.assignmentId)))return NextResponse.json({error:"all_instructors_required"},{status:400});
    const kgasSubject=request.headers.get("x-kgas-subject"); const deviceHash=hashSubject(parsed.data.deviceId,session.id); const subjectHash=hashSubject(kgasSubject??parsed.data.deviceId,session.id);
    const existing=await db.select({id:participation.id,status:participation.status}).from(participation).where(and(eq(participation.sessionId,session.id),or(eq(participation.subjectHash,subjectHash),eq(participation.deviceHash,deviceHash)))).limit(1); if(existing[0]?.status==="COMPLETED")return NextResponse.json({error:"already_submitted"},{status:409});
    const elsewhere=await completedElsewhereInTerm(db,session.termId,session.classId,session.id,parsed.data.deviceId,kgasSubject); if(elsewhere)return duplicateError(elsewhere);
    await db.transaction(async tx=>{if(existing[0]){await tx.update(participation).set({status:"COMPLETED",completedAssignments:parsed.data.responses.length,completedAt:new Date(),lastSeenAt:new Date()}).where(eq(participation.id,existing[0].id));}else{await tx.insert(participation).values({sessionId:session.id,subjectHash,deviceHash,status:"COMPLETED",completedAssignments:parsed.data.responses.length,completedAt:new Date(),lastSeenAt:new Date()});}await tx.insert(anonymousResponses).values(parsed.data.responses.map(r=>({sessionId:session.id,assignmentId:r.assignmentId,answers:r.answers,comment:r.comment?.trim()||null,language:parsed.data.language})));});
    return NextResponse.json({ok:true,receipt:crypto.randomUUID().slice(0,8).toUpperCase()});
  } catch(error){if(error instanceof Error&&error.message.includes("unique"))return NextResponse.json({error:"already_submitted"},{status:409});return NextResponse.json({error:"service_unavailable"},{status:503});}
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const payload = z.object({ deviceId: z.string().min(16).max(128) }).safeParse(await request.json());
    if (!payload.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });
    const session = await findSession(token);
    if (!session || !isSessionOpen(session)) return NextResponse.json({ error: "session_unavailable" }, { status: 410 });
    const db = getDb();
    const deviceHash = hashSubject(payload.data.deviceId, session.id);
    const kgasSubject = request.headers.get("x-kgas-subject");
    const subjectHash = hashSubject(kgasSubject ?? payload.data.deviceId, session.id);
    const existing = await db.select({ id: participation.id, status: participation.status }).from(participation).where(and(eq(participation.sessionId, session.id), or(eq(participation.deviceHash, deviceHash), eq(participation.subjectHash, subjectHash)))).limit(1);
    if (existing[0]?.status === "COMPLETED") return NextResponse.json({ error: "already_submitted" }, { status: 409 });
    const elsewhere = await completedElsewhereInTerm(db, session.termId, session.classId, session.id, payload.data.deviceId, kgasSubject);
    if (elsewhere) return duplicateError(elsewhere);
    if (existing[0]) await db.update(participation).set({ status: "IN_PROGRESS", lastSeenAt: new Date() }).where(eq(participation.id, existing[0].id));
    else await db.insert(participation).values({ sessionId: session.id, subjectHash, deviceHash, status: "IN_PROGRESS", lastSeenAt: new Date() });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("unique")) return NextResponse.json({ error: "already_submitted" }, { status: 409 });
    return NextResponse.json({ error: "service_unavailable" }, { status: 503 });
  }
}
