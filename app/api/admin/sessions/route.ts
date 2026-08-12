import { NextResponse } from "next/server";
import { z } from "zod";
import { evaluationSessions, questionnaireVersions } from "@/db/schema";
import { getDb } from "@/lib/db";
import { createPublicToken, hashToken } from "@/lib/security";
import { eq } from "drizzle-orm";
import { getAdminSession } from "@/lib/auth";

const input=z.object({classId:z.uuid(),targetCount:z.number().int().positive(),durationMinutes:z.number().int().min(1).max(30).default(10)});
export async function POST(request:Request){const admin=await getAdminSession();if(!admin)return NextResponse.json({error:"unauthorized"},{status:401});const parsed=input.safeParse(await request.json());if(!parsed.success)return NextResponse.json({error:"invalid_request"},{status:400});try{const db=getDb();const questionnaires=await db.select({id:questionnaireVersions.id}).from(questionnaireVersions).limit(1);if(!questionnaires[0])return NextResponse.json({error:"questionnaire_required"},{status:409});const token=createPublicToken();const now=new Date();const expires=new Date(now.getTime()+parsed.data.durationMinutes*60_000);const [session]=await db.insert(evaluationSessions).values({classId:parsed.data.classId,questionnaireId:questionnaires[0].id,tokenHash:hashToken(token),status:"ACTIVE",targetCount:parsed.data.targetCount,opensAt:now,expiresAt:expires}).returning({id:evaluationSessions.id});return NextResponse.json({id:session.id,url:`${process.env.APP_URL??"http://localhost:3000"}/survey/${token}`,expiresAt:expires.toISOString()});}catch{return NextResponse.json({error:"service_unavailable"},{status:503})}}
export async function DELETE(request:Request){const admin=await getAdminSession();if(!admin)return NextResponse.json({error:"unauthorized"},{status:401});const id=new URL(request.url).searchParams.get("id");if(!id)return NextResponse.json({error:"id_required"},{status:400});try{await getDb().update(evaluationSessions).set({status:"CLOSED",closedAt:new Date()}).where(eq(evaluationSessions.id,id));return NextResponse.json({ok:true});}catch{return NextResponse.json({error:"service_unavailable"},{status:503})}}
