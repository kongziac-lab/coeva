import { NextRequest, NextResponse } from "next/server";
import { and, eq, or, sql } from "drizzle-orm";
import { z } from "zod";
import { anonymousResponses, classes, evaluationSessions, participation, questionnaireVersions, teachingAssignments, instructors } from "@/db/schema";
import { getDb } from "@/lib/db";
import { hashSubject, hashToken } from "@/lib/security";
import { getSurveyPayload } from "@/lib/survey-session";

const answerSet = z.object({ assignmentId: z.uuid(), answers: z.array(z.number().int().min(1).max(5)).length(7), comment: z.string().max(1000).optional() });
const submission = z.object({ deviceId: z.string().min(16).max(128), language: z.string().max(12), responses: z.array(answerSet).min(2).max(4) });

async function findSession(token: string) {
  const db = getDb();
  const rows = await db.select({ id:evaluationSessions.id,status:evaluationSessions.status,expiresAt:evaluationSessions.expiresAt,classId:classes.id,classCode:classes.code,room:classes.room,questionnaireId:questionnaireVersions.id,questions:questionnaireVersions.questions })
    .from(evaluationSessions).innerJoin(classes,eq(evaluationSessions.classId,classes.id)).innerJoin(questionnaireVersions,eq(evaluationSessions.questionnaireId,questionnaireVersions.id))
    .where(eq(evaluationSessions.tokenHash,hashToken(token))).limit(1);
  return rows[0];
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const payload = await getSurveyPayload(token);
  if (!payload) return NextResponse.json({ error: "session_unavailable" }, { status: 410 });
  return NextResponse.json(payload, { headers: { "cache-control": "no-store" } });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token }=await params; const parsed=submission.safeParse(await request.json()); if(!parsed.success)return NextResponse.json({error:"invalid_submission"},{status:400});
    const session=await findSession(token); if(!session||session.status!=="ACTIVE")return NextResponse.json({error:"session_unavailable"},{status:410});
    const db=getDb(); const validAssignments=await db.select({id:teachingAssignments.id}).from(teachingAssignments).where(eq(teachingAssignments.classId,session.classId));
    const expected=new Set(validAssignments.map(a=>a.id)); if(parsed.data.responses.length!==expected.size||parsed.data.responses.some(r=>!expected.has(r.assignmentId)))return NextResponse.json({error:"all_instructors_required"},{status:400});
    const kgasSubject=request.headers.get("x-kgas-subject"); const deviceHash=hashSubject(parsed.data.deviceId,session.id); const subjectHash=hashSubject(kgasSubject??parsed.data.deviceId,session.id);
    const existing=await db.select({id:participation.id,status:participation.status}).from(participation).where(and(eq(participation.sessionId,session.id),or(eq(participation.subjectHash,subjectHash),eq(participation.deviceHash,deviceHash)))).limit(1); if(existing[0]?.status==="COMPLETED")return NextResponse.json({error:"already_submitted"},{status:409});
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
    if (!session || session.status !== "ACTIVE") return NextResponse.json({ error: "session_unavailable" }, { status: 410 });
    const db = getDb();
    const deviceHash = hashSubject(payload.data.deviceId, session.id);
    const kgasSubject = request.headers.get("x-kgas-subject");
    const subjectHash = hashSubject(kgasSubject ?? payload.data.deviceId, session.id);
    const existing = await db.select({ id: participation.id, status: participation.status }).from(participation).where(and(eq(participation.sessionId, session.id), or(eq(participation.deviceHash, deviceHash), eq(participation.subjectHash, subjectHash)))).limit(1);
    if (existing[0]?.status === "COMPLETED") return NextResponse.json({ error: "already_submitted" }, { status: 409 });
    if (existing[0]) await db.update(participation).set({ status: "IN_PROGRESS", lastSeenAt: new Date() }).where(eq(participation.id, existing[0].id));
    else await db.insert(participation).values({ sessionId: session.id, subjectHash, deviceHash, status: "IN_PROGRESS", lastSeenAt: new Date() });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("unique")) return NextResponse.json({ error: "already_submitted" }, { status: 409 });
    return NextResponse.json({ error: "service_unavailable" }, { status: 503 });
  }
}
