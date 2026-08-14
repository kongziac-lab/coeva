import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { instructors } from "@/db/schema";
import { auditAdminAction, requireSystemAdmin } from "@/lib/admin-access";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxFileSize = 1_500_000;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireSystemAdmin();
  if (!actor) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await params;
  const formData = await request.formData();
  const file = formData.get("photo");
  if (!(file instanceof File) || !allowedTypes.has(file.type) || file.size === 0 || file.size > maxFileSize) {
    return NextResponse.json({ error: "JPEG, PNG, WebP 파일을 1.5MB 이하로 등록해 주세요." }, { status: 400 });
  }

  try {
    const [target] = await getDb().select({ id: instructors.id, name: instructors.name }).from(instructors).where(eq(instructors.id, id)).limit(1);
    if (!target) return NextResponse.json({ error: "강사를 찾을 수 없습니다." }, { status: 404 });
    const photoData = `data:${file.type};base64,${Buffer.from(await file.arrayBuffer()).toString("base64")}`;
    await getDb().update(instructors).set({ photoData }).where(eq(instructors.id, id));
    await auditAdminAction(actor.email, "INSTRUCTOR_PHOTO_UPDATE", id, { instructorName: target.name, mimeType: file.type, size: file.size }, "instructor");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "사진을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요." }, { status: 503 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireSystemAdmin();
  if (!actor) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { id } = await params;

  try {
    const [target] = await getDb().select({ id: instructors.id, name: instructors.name }).from(instructors).where(eq(instructors.id, id)).limit(1);
    if (!target) return NextResponse.json({ error: "강사를 찾을 수 없습니다." }, { status: 404 });
    await getDb().update(instructors).set({ photoData: null }).where(eq(instructors.id, id));
    await auditAdminAction(actor.email, "INSTRUCTOR_PHOTO_DELETE", id, { instructorName: target.name }, "instructor");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "사진을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요." }, { status: 503 });
  }
}
