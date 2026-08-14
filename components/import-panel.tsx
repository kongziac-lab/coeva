"use client";

import { useState } from "react";
import { CheckCircle2, FileSpreadsheet, UploadCloud } from "lucide-react";
import * as XLSX from "xlsx";

type Preview = { date: string; start: string; end: string; classCode: string; room: string; instructors: string[]; target: number };

export function ImportPanel() {
  const [rows, setRows] = useState<Preview[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [complete, setComplete] = useState(false);

  async function select(selected: File) {
    setFile(selected); setName(selected.name); setError(""); setComplete(false);
    try {
      const book = XLSX.read(await selected.arrayBuffer(), { type: "array", cellDates: false });
      const raw = XLSX.utils.sheet_to_json<unknown[]>(book.Sheets[book.SheetNames[0]], { header: 1, defval: null });
      const headerRowIndex = raw.findIndex((r, index) => index > 0 && Array.isArray(r) && String(r[0] ?? "").trim() === "일자");
      const dataStartIndex = headerRowIndex >= 0 ? headerRowIndex + 1 : 1;
      const parsed = raw.slice(dataStartIndex).filter((r) => Array.isArray(r) && r[3]).map((r: unknown[]) => ({
        date: String(r[0] ?? ""), start: formatTime(r[1]), end: formatTime(r[2]), classCode: String(r[3]), room: String(r[4]),
        instructors: r.slice(5, 9).filter(Boolean).map(String), target: Number(String(r[9] ?? "").replace(/[^0-9]/g, "")) || 0,
      }));
      if (!parsed.length) throw new Error();
      setRows(parsed);
    } catch { setError("필수 열(일자, 시작시간, 종료시간, 반, 강의실, 강사 1~4)을 확인해 주세요."); setRows([]); }
  }

  async function upload() {
    if (!file) return;
    setUploading(true); setError("");
    const data = new FormData(); data.append("file", file);
    try {
      const response = await fetch("/api/admin/import", { method: "POST", body: data });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message ?? "일정을 가져오지 못했습니다.");
      setComplete(true);
    } catch (uploadError) { setError(uploadError instanceof Error ? uploadError.message : "일정을 가져오지 못했습니다."); }
    finally { setUploading(false); }
  }

  return <div>
    <label style={{ display: "grid", placeItems: "center", border: "2px dashed #cbd8e7", borderRadius: 16, padding: 36, cursor: "pointer", background: "#fafcff" }}>
      <UploadCloud size={32} color="#1b66c9"/><strong style={{ marginTop: 12 }}>강의평가 일정 엑셀을 선택하세요</strong><span style={{ fontSize: 12, color: "#65758a", marginTop: 5 }}>XLSX · 최대 5MB</span>
      <input type="file" accept=".xlsx,.xls" hidden onChange={(e) => e.target.files?.[0] && select(e.target.files[0])}/>
    </label>
    {error && <div className="error" style={{ marginTop: 14 }}>{error}</div>}
    {complete && <div style={{ marginTop: 14, padding: 12, borderRadius: 10, background: "#e7f7f1", color: "#13775b", fontSize: 13 }}>{rows.length}개 반을 성공적으로 가져왔습니다.</div>}
    {rows.length > 0 && <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "20px 0 12px" }}><div style={{ display: "flex", gap: 9, alignItems: "center" }}><FileSpreadsheet size={20} color="#25a67a"/><div><strong>{name}</strong><div style={{ fontSize: 11, color: "#65758a" }}>{rows.length}개 반 · 형식 검증 완료</div></div></div><span className="status NORMAL"><CheckCircle2 size={12}/> 가져오기 준비</span></div>
      <div className="table-card" style={{ border: "1px solid #dfe6ef", borderRadius: 14, maxHeight: 420, overflow: "auto" }}><table className="data-table"><thead><tr><th>일자</th><th>시간</th><th>반</th><th>강의실</th><th>강사</th><th>대상</th></tr></thead><tbody>{rows.slice(0, 15).map((r, i) => <tr key={i}><td>{r.date || "앞 행과 동일"}</td><td>{r.start}–{r.end}</td><td>{r.classCode}반</td><td>{r.room}</td><td>{r.instructors.join(", ")}</td><td>{r.target ? `${r.target}명` : "미입력"}</td></tr>)}</tbody></table></div>
      {rows.length > 15 && <div style={{ fontSize: 11, color: "#65758a", marginTop: 8 }}>외 {rows.length - 15}개 반</div>}
      <button className="btn btn-primary" disabled={uploading || complete} onClick={upload} style={{ marginTop: 18, width: "100%", opacity: uploading || complete ? 0.6 : 1 }}>{uploading ? "가져오는 중…" : complete ? "가져오기 완료" : "2026년 여름학기로 가져오기"}</button>
    </>}
  </div>;
}

function formatTime(value: unknown) {
  if (value instanceof Date) return `${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}`;
  if (typeof value === "number") { const minutes = Math.round(value * 24 * 60); return `${String(Math.floor(minutes / 60) % 24).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`; }
  return String(value ?? "");
}
