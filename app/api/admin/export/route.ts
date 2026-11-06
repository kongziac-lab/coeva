import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { instructors, termResults, terms } from "@/db/schema";
import { getAdminSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET(request: Request){
  if(!await getAdminSession()) return NextResponse.json({error:"unauthorized"},{status:401});
  const statusName = { NORMAL:"정상", WARNING:"1차 경고", RESTRICTION:"강의 제한", INSUFFICIENT:"판정보류" } as const;
  const termId=new URL(request.url).searchParams.get("term");
  if(termId && !/^[0-9a-f-]{36}$/i.test(termId)) return NextResponse.json({error:"invalid_term"},{status:400});
  const rows=await getDb().select({term:terms.name,name:instructors.name,responses:termResults.responseCount,eligible:termResults.eligibleOpportunities,rate:termResults.participationRate,score:termResults.rawScore,status:termResults.status,reason:termResults.reason}).from(termResults).innerJoin(instructors,eq(termResults.instructorId,instructors.id)).innerJoin(terms,eq(termResults.termId,terms.id)).where(termId ? eq(termResults.termId, termId) : undefined);
  const header=["학기","강사","유효 응답","평가 대상","참여율","학기점수","규정상태","판정근거"];
  const data=rows.map(row=>[row.term,row.name,row.responses,row.eligible,`${(row.rate*100).toFixed(1)}%`,row.score?.toFixed(3)??"",statusName[row.status],row.reason]);
  const csv="\uFEFF"+[header,...data].map(row=>row.map(value=>`"${String(value).replaceAll('"','""')}"`).join(',')).join('\r\n');
  return new NextResponse(csv,{headers:{"content-type":"text/csv; charset=utf-8","content-disposition":`attachment; filename="lecture-evaluation-results.csv"`}});
}
