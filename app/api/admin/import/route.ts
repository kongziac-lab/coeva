import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { and, eq } from "drizzle-orm";
import { classes, instructors, teachingAssignments, terms, auditLogs } from "@/db/schema";
import { getAdminSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

function excelTime(value: unknown, day: Date) {
  const result = new Date(day);
  if (typeof value === "number") { const minutes=Math.round(value*24*60); result.setHours(Math.floor(minutes/60)%24,minutes%60,0,0); return result; }
  if (value instanceof Date) { result.setHours(value.getHours(),value.getMinutes(),0,0); return result; }
  const [h,m]=String(value??"0:0").split(":").map(Number); result.setHours(h||0,m||0,0,0); return result;
}

export async function POST(request:Request){const admin=await getAdminSession();if(!admin)return NextResponse.json({error:"unauthorized"},{status:401});const form=await request.formData();const file=form.get("file");if(!(file instanceof File)||file.size>5*1024*1024)return NextResponse.json({error:"invalid_file"},{status:400});try{const workbook=XLSX.read(await file.arrayBuffer(),{type:"array",cellDates:true});const raw=XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[workbook.SheetNames[0]],{header:1,defval:null});const rows=raw.slice(1).filter(r=>Array.isArray(r)&&r[3]);if(!rows.length)return NextResponse.json({error:"empty_file"},{status:400});const db=getDb();let [term]=await db.select().from(terms).where(eq(terms.active,true)).limit(1);if(!term){[term]=await db.insert(terms).values({code:"2026-SUMMER",name:"2026년 여름학기",startsAt:new Date("2026-06-01T00:00:00+09:00"),endsAt:new Date("2026-08-31T23:59:59+09:00"),active:true}).returning();}let imported=0;await db.transaction(async tx=>{for(const row of rows as unknown[][]){const classCode=String(row[3]);const day=new Date("2026-08-05T00:00:00+09:00");const start=excelTime(row[1],day),end=excelTime(row[2],day);const [classRow]=await tx.insert(classes).values({termId:term.id,code:classCode,room:String(row[4]),scheduledAt:start,scheduledEndAt:end}).onConflictDoUpdate({target:[classes.termId,classes.code],set:{room:String(row[4]),scheduledAt:start,scheduledEndAt:end}}).returning();const names=row.slice(5,9).filter(Boolean).map(String);for(let i=0;i<names.length;i++){let [instructor]=await tx.select().from(instructors).where(eq(instructors.name,names[i])).limit(1);if(!instructor)[instructor]=await tx.insert(instructors).values({name:names[i]}).returning();await tx.insert(teachingAssignments).values({classId:classRow.id,instructorId:instructor.id,position:i+1}).onConflictDoNothing();}imported++;}await tx.insert(auditLogs).values({action:"SCHEDULE_IMPORT",entityType:"term",entityId:term.id,detail:{filename:file.name,classes:imported,actor:admin.email}});});return NextResponse.json({ok:true,classes:imported});}catch{return NextResponse.json({error:"import_failed"},{status:500})}}
