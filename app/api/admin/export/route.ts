import { NextResponse } from "next/server";
import { instructorResults } from "@/lib/demo-data";

export async function GET(){const header=["강사","평가 반 수","유효 응답","평가 대상","참여율","학기점수","직전점수","규정상태"];const rows=instructorResults.map(r=>[r.name,r.classes,r.responses,r.eligible,(r.responses/r.eligible*100).toFixed(1)+"%",r.score.toFixed(3),r.previous.toFixed(3),r.status]);const csv="\uFEFF"+[header,...rows].map(row=>row.map(v=>`"${String(v).replaceAll('"','""')}"`).join(',')).join('\r\n');return new NextResponse(csv,{headers:{"content-type":"text/csv; charset=utf-8","content-disposition":`attachment; filename="lecture-evaluation-results.csv"`}})}
