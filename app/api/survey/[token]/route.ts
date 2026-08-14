import { NextRequest, NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { anonymousResponses, classes, evaluationSessions, participation, questionnaireVersions, teachingAssignments, instructors } from "@/db/schema";
import { getDb } from "@/lib/db";
import { hashSubject, hashToken } from "@/lib/security";

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
  try {
    const { token } = await params; const session = await findSession(token);
    if (!session || session.status !== "ACTIVE" || !session.expiresAt || session.expiresAt <= new Date()) return NextResponse.json({ error:"session_unavailable" },{status:410});
    const db=getDb(); const assigned=await db.select({assignmentId:teachingAssignments.id,instructorId:instructors.id,name:instructors.name,hasPhoto:sql<boolean>`${instructors.photoData} is not null`}).from(teachingAssignments).innerJoin(instructors,eq(teachingAssignments.instructorId,instructors.id)).where(eq(teachingAssignments.classId,session.classId)).orderBy(teachingAssignments.position);
    return NextResponse.json({classCode:session.classCode,room:session.room,instructors:assigned.map(({assignmentId,instructorId,name,hasPhoto})=>({assignmentId,name,photoUrl:hasPhoto?`/api/instructors/${instructorId}/photo`:null})),questions:session.questions},{headers:{"cache-control":"no-store"}});
  } catch { return NextResponse.json({error:"service_unavailable"},{status:503}); }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token }=await params; const parsed=submission.safeParse(await request.json()); if(!parsed.success)return NextResponse.json({error:"invalid_submission"},{status:400});
    const session=await findSession(token); if(!session||session.status!=="ACTIVE"||!session.expiresAt||session.expiresAt<=new Date())return NextResponse.json({error:"session_unavailable"},{status:410});
    const db=getDb(); const validAssignments=await db.select({id:teachingAssignments.id}).from(teachingAssignments).where(eq(teachingAssignments.classId,session.classId));
    const expected=new Set(validAssignments.map(a=>a.id)); if(parsed.data.responses.length!==expected.size||parsed.data.responses.some(r=>!expected.has(r.assignmentId)))return NextResponse.json({error:"all_instructors_required"},{status:400});
    const kgasSubject=request.headers.get("x-kgas-subject"); const deviceHash=hashSubject(parsed.data.deviceId,session.id); const subjectHash=hashSubject(kgasSubject??parsed.data.deviceId,session.id);
    const duplicate=await db.select({id:participation.id}).from(participation).where(and(eq(participation.sessionId,session.id),eq(participation.subjectHash,subjectHash))).limit(1); if(duplicate.length)return NextResponse.json({error:"already_submitted"},{status:409});
    await db.transaction(async tx=>{await tx.insert(participation).values({sessionId:session.id,subjectHash,deviceHash,status:"COMPLETED",completedAssignments:parsed.data.responses.length,completedAt:new Date()});await tx.insert(anonymousResponses).values(parsed.data.responses.map(r=>({sessionId:session.id,assignmentId:r.assignmentId,answers:r.answers,comment:r.comment?.trim()||null,language:parsed.data.language})));});
    return NextResponse.json({ok:true,receipt:crypto.randomUUID().slice(0,8).toUpperCase()});
  } catch(error){if(error instanceof Error&&error.message.includes("unique"))return NextResponse.json({error:"already_submitted"},{status:409});return NextResponse.json({error:"service_unavailable"},{status:503});}
}
