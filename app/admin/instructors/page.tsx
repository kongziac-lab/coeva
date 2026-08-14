import { asc, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { instructors } from "@/db/schema";
import { AdminShell } from "@/components/admin-shell";
import { InstructorPhotoPanel } from "@/components/instructor-photo-panel";
import { getAdminSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

export default async function InstructorsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/login?returnTo=/admin/instructors");
  if (session.role !== "SYSTEM_ADMIN") redirect("/admin");

  let instructorList: Array<{ id: string; externalId: string | null; name: string; photoUrl: string | null }> = [];
  try {
    const rows = await getDb().select({ id: instructors.id, externalId: instructors.externalId, name: instructors.name, hasPhoto: sql<boolean>`${instructors.photoData} is not null` }).from(instructors).orderBy(asc(instructors.name));
    instructorList = rows.map(({ id, externalId, name, hasPhoto }) => ({ id, externalId, name, photoUrl: hasPhoto ? `/api/instructors/${id}/photo` : null }));
  } catch { /* The panel presents an empty state while the database is unavailable. */ }

  return <AdminShell active="/admin/instructors" title="강사 사진 관리"><div className="content">
    <div className="page-head"><div><h1>강사 사진 관리</h1><p>학생이 설문에서 강사를 정확히 확인할 수 있도록 사진을 등록하세요.</p></div></div>
    <div className="photo-guidance">JPEG, PNG, WebP · 파일당 최대 1.5MB · 일괄등록은 파일명을 강사명 또는 강사번호로 저장하세요.</div>
    <InstructorPhotoPanel initialInstructors={instructorList} />
  </div></AdminShell>;
}
