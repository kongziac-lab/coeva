"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { Camera, CheckCircle2, ImagePlus, Trash2, UserRound } from "lucide-react";

type InstructorItem = { id: string; externalId: string | null; name: string; photoUrl: string | null };
type BatchRow = { key: string; file: File; instructorId: string; match: "exact" | "suggested" | "manual" | "unmatched"; error?: string; status: "ready" | "uploading" | "done" | "error" };

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxFileSize = 1_500_000;

function normalize(value: string | null | undefined) {
  return (value ?? "").normalize("NFKC").toLowerCase().replace(/\.[^.]+$/, "").replace(/(강사|선생님|teacher|instructor)/gi, "").replace(/[^0-9a-z가-힣]/g, "");
}

function findMatch(file: File, instructors: InstructorItem) {
  const base = normalize(file.name);
  const name = normalize(instructors.name);
  const externalId = normalize(instructors.externalId);
  return base === name || (externalId && base === externalId) ? "exact" : base.includes(name) || (externalId.length > 0 && base.includes(externalId)) ? "suggested" : null;
}

export function InstructorPhotoPanel({ initialInstructors }: { initialInstructors: InstructorItem[] }) {
  const [items, setItems] = useState(initialInstructors);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [batchRows, setBatchRows] = useState<BatchRow[]>([]);
  const [batchRunning, setBatchRunning] = useState(false);
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

  function selectBatchFiles(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    const nextRows: BatchRow[] = selected.map((file, index) => {
      const key = `${file.name}-${file.size}-${file.lastModified}-${index}`;
      if (!allowedTypes.has(file.type)) return { key, file, instructorId: "", match: "unmatched", error: "JPEG, PNG, WebP만 등록할 수 있습니다.", status: "error" };
      if (file.size === 0 || file.size > maxFileSize) return { key, file, instructorId: "", match: "unmatched", error: "파일 크기는 1.5MB 이하여야 합니다.", status: "error" };
      const exact = items.filter((item) => findMatch(file, item) === "exact");
      const suggested = items.filter((item) => findMatch(file, item) === "suggested");
      const candidate = exact.length === 1 ? exact[0] : exact.length === 0 && suggested.length === 1 ? suggested[0] : null;
      return { key, file, instructorId: candidate?.id ?? "", match: exact.length === 1 ? "exact" : candidate ? "suggested" : "unmatched", error: exact.length > 1 || suggested.length > 1 ? "일치하는 강사가 여러 명입니다. 대상을 선택해 주세요." : candidate ? undefined : "대상 강사를 선택해 주세요.", status: candidate ? "ready" : "error" };
    });
    setBatchRows(nextRows);
    setError("");
  }

  function updateBatchTarget(key: string, instructorId: string) {
    setBatchRows((rows) => rows.map((row) => row.key === key ? { ...row, instructorId, match: instructorId ? "manual" : "unmatched", error: instructorId ? undefined : "대상 강사를 선택해 주세요.", status: instructorId ? "ready" : "error" } : row));
  }

  async function uploadBatch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const targets = new Map<string, number>();
    for (const row of batchRows) if (row.instructorId) targets.set(row.instructorId, (targets.get(row.instructorId) ?? 0) + 1);
    const hasInvalid = batchRows.some((row) => !row.instructorId || row.status === "error") || Array.from(targets.values()).some((count) => count > 1);
    if (hasInvalid) { setError("각 파일의 대상 강사를 선택하고 중복 대상을 확인해 주세요."); return; }

    setBatchRunning(true); setError("");
    for (const row of batchRows) {
      setBatchRows((rows) => rows.map((item) => item.key === row.key ? { ...item, status: "uploading" } : item));
      try {
        const formData = new FormData(); formData.append("photo", row.file);
        const response = await fetch(`/api/admin/instructors/${row.instructorId}/photo`, { method: "POST", body: formData });
        const body = await response.json() as { ok?: boolean; error?: string };
        if (!response.ok || !body.ok) throw new Error(body.error ?? "등록에 실패했습니다.");
        setItems((current) => current.map((item) => item.id === row.instructorId ? { ...item, photoUrl: `/api/instructors/${row.instructorId}/photo?v=${Date.now()}` } : item));
        setBatchRows((rows) => rows.map((item) => item.key === row.key ? { ...item, status: "done" } : item));
      } catch (uploadError) {
        setBatchRows((rows) => rows.map((item) => item.key === row.key ? { ...item, status: "error", error: uploadError instanceof Error ? uploadError.message : "등록에 실패했습니다." } : item));
      }
    }
    setBatchRunning(false);
  }

  if (items.length === 0) return <div className="card empty-state"><UserRound size={30} /><h2>등록된 강사가 없습니다</h2><p>먼저 강의평가 일정 엑셀을 가져오면 강사 명단이 생성됩니다.</p></div>;

  const completedCount = batchRows.filter((row) => row.status === "done").length;
  return <>
    {error && <div className="error instructor-error" role="alert">{error}</div>}
    <section className="card batch-photo-card">
      <div className="batch-photo-heading"><div><h2><ImagePlus size={20} />사진 일괄등록</h2><p>파일명을 강사명 또는 강사번호로 저장하면 자동으로 연결됩니다. 예: 박현진.jpg</p></div><span className="batch-count">{completedCount}/{batchRows.length || 0}</span></div>
      <form className="batch-photo-form" onSubmit={uploadBatch}>
        <label className="batch-file-picker"><ImagePlus size={18} /><span>사진 여러 장 선택</span><input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={selectBatchFiles} /></label>
        {batchRows.length > 0 && <div className="batch-file-list">{batchRows.map((row) => <div className={`batch-file-row ${row.status}`} key={row.key}>
          <span className="batch-file-name">{row.file.name}</span>
          <select value={row.instructorId} onChange={(event) => updateBatchTarget(row.key, event.target.value)} aria-label={`${row.file.name} 대상 강사`} disabled={batchRunning || row.status === "done"}><option value="">대상 강사 선택</option>{items.map((item) => <option value={item.id} key={item.id}>{item.name}{item.externalId ? ` (${item.externalId})` : ""}</option>)}</select>
          <span className="batch-file-status">{row.status === "done" ? <><CheckCircle2 size={15} />등록 완료</> : row.error ?? (row.match === "exact" ? "자동 일치" : row.match === "suggested" ? "유사 일치" : "대상 선택 필요")}</span>
        </div>)}</div>}
        <button className="btn btn-primary batch-submit" type="submit" disabled={batchRunning || batchRows.length === 0}>{batchRunning ? "일괄 등록 중..." : "선택한 사진 일괄 등록"}</button>
      </form>
    </section>
    <div className="instructor-photo-grid">
      {items.map((item) => <article className="card instructor-photo-card" key={item.id}>
        <div className="instructor-photo-preview">{item.photoUrl ? <img src={item.photoUrl} alt={`${item.name} 선생님`} /> : <UserRound size={44} aria-hidden="true" />}</div>
        <div className="instructor-photo-copy"><h2>{item.name}</h2><p>{item.externalId ? `강사번호 ${item.externalId}` : "강사번호 없음"}</p></div>
        <form onSubmit={(event) => upload(event, item.id)}>
          <label className="photo-file-label"><Camera size={16} /><span>사진 선택</span><input name="photo" type="file" accept="image/jpeg,image/png,image/webp" required /></label>
          <button className="btn btn-primary" type="submit" disabled={busyId === item.id || batchRunning}>{busyId === item.id ? "저장 중" : item.photoUrl ? "사진 변경" : "사진 등록"}</button>
        </form>
        {item.photoUrl && <button className="btn btn-danger photo-delete" type="button" disabled={busyId === item.id || batchRunning} onClick={() => remove(item.id)}><Trash2 size={15} />사진 삭제</button>}
      </article>)}
    </div>
  </>;
}
