"use client";

import { FormEvent, useState } from "react";
import { Camera, Trash2, UserRound } from "lucide-react";

type InstructorItem = { id: string; externalId: string | null; name: string; photoUrl: string | null };

export function InstructorPhotoPanel({ initialInstructors }: { initialInstructors: InstructorItem[] }) {
  const [items, setItems] = useState(initialInstructors);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function upload(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    const form = event.currentTarget;
    setBusyId(id); setError("");
    try {
      const response = await fetch(`/api/admin/instructors/${id}/photo`, { method: "POST", body: new FormData(form) });
      const body = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok || !body.ok) throw new Error(body.error ?? "사진을 저장하지 못했습니다.");
      setItems((current) => current.map((item) => item.id === id ? { ...item, photoUrl: `/api/instructors/${id}/photo?v=${Date.now()}` } : item));
      form.reset();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "사진을 저장하지 못했습니다.");
    } finally { setBusyId(null); }
  }

  async function remove(id: string) {
    setBusyId(id); setError("");
    try {
      const response = await fetch(`/api/admin/instructors/${id}/photo`, { method: "DELETE" });
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "사진을 삭제하지 못했습니다.");
      setItems((current) => current.map((item) => item.id === id ? { ...item, photoUrl: null } : item));
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "사진을 삭제하지 못했습니다.");
    } finally { setBusyId(null); }
  }

  if (items.length === 0) return <div className="card empty-state"><UserRound size={30} /><h2>등록된 강사가 없습니다</h2><p>먼저 강의평가 일정 엑셀을 가져오면 강사 명단이 생성됩니다.</p></div>;

  return <>
    {error && <div className="error instructor-error" role="alert">{error}</div>}
    <div className="instructor-photo-grid">
      {items.map((item) => <article className="card instructor-photo-card" key={item.id}>
        <div className="instructor-photo-preview">{item.photoUrl ? <img src={item.photoUrl} alt={`${item.name} 선생님`} /> : <UserRound size={44} aria-hidden="true" />}</div>
        <div className="instructor-photo-copy"><h2>{item.name}</h2><p>{item.externalId ? `강사번호 ${item.externalId}` : "강사번호 없음"}</p></div>
        <form onSubmit={(event) => upload(event, item.id)}>
          <label className="photo-file-label"><Camera size={16} /><span>사진 선택</span><input name="photo" type="file" accept="image/jpeg,image/png,image/webp" required /></label>
          <button className="btn btn-primary" type="submit" disabled={busyId === item.id}>{busyId === item.id ? "저장 중" : item.photoUrl ? "사진 변경" : "사진 등록"}</button>
        </form>
        {item.photoUrl && <button className="btn btn-danger photo-delete" type="button" disabled={busyId === item.id} onClick={() => remove(item.id)}><Trash2 size={15} />사진 삭제</button>}
      </article>)}
    </div>
  </>;
}
