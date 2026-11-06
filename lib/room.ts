// 엑셀 강의실 값이 "301"이든 "301호"이든 화면에는 "301호" 하나로 보이게 한다.
export function roomNumber(room: string) {
  return String(room ?? "").trim().replace(/\s*호$/, "");
}

export function roomLabel(room: string) {
  const value = roomNumber(room);
  return value ? `${value}호` : "";
}
