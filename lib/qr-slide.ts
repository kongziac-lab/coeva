import QRCode from "qrcode";

export type SlideCard = { classCode: string; room: string; instructors: string[]; url: string };

const WIDTH = 1920;
const HEIGHT = 1080;
const NAVY = "#0d3168";
const MUTED = "#5b6b84";

function fitText(context: CanvasRenderingContext2D, text: string, maxWidth: number, weight: number, size: number, family: string) {
  let current = size;
  context.font = `${weight} ${current}px ${family}`;
  while (current > 18 && context.measureText(text).width > maxWidth) {
    current -= 2;
    context.font = `${weight} ${current}px ${family}`;
  }
  return current;
}

// 교실 TV·프로젝터에 띄우기 좋은 1920×1080 PNG 한 장. 브라우저에서만 동작한다.
export async function renderQrSlide(card: SlideCard, termName: string, fontFamily: string): Promise<Uint8Array> {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas_unavailable");

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, WIDTH, HEIGHT);
  context.fillStyle = NAVY;
  context.fillRect(0, 0, WIDTH, 96);
  context.fillStyle = "#ffffff";
  context.textBaseline = "middle";
  context.font = `800 40px ${fontFamily}`;
  context.fillText("K-강의평가", 72, 48);
  context.font = `500 32px ${fontFamily}`;
  context.textAlign = "right";
  context.fillText(termName, WIDTH - 72, 48);
  context.textAlign = "left";

  const qrSize = 820;
  const qrX = WIDTH - qrSize - 90;
  const qrY = 96 + (HEIGHT - 96 - qrSize) / 2;
  const qrCanvas = document.createElement("canvas");
  await QRCode.toCanvas(qrCanvas, card.url, { width: qrSize, margin: 2, errorCorrectionLevel: "M", color: { dark: NAVY, light: "#ffffff" } });
  context.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

  const left = 96;
  const textWidth = qrX - left - 80;
  context.textBaseline = "alphabetic";
  context.fillStyle = NAVY;
  fitText(context, `${card.classCode}반`, textWidth, 900, 220, fontFamily);
  context.fillText(`${card.classCode}반`, left, 420);
  context.fillStyle = MUTED;
  fitText(context, `${card.room}호`, textWidth, 800, 110, fontFamily);
  context.fillText(`${card.room}호`, left, 560);
  if (card.instructors.length) {
    fitText(context, card.instructors.join(" · "), textWidth, 500, 44, fontFamily);
    context.fillText(card.instructors.join(" · "), left, 650);
  }
  context.fillStyle = "#16233a";
  fitText(context, "휴대폰 카메라로 QR을 스캔하세요", textWidth, 800, 56, fontFamily);
  context.fillText("휴대폰 카메라로 QR을 스캔하세요", left, 860);
  context.fillStyle = MUTED;
  fitText(context, "Scan the QR code with your phone camera", textWidth, 500, 38, fontFamily);
  context.fillText("Scan the QR code with your phone camera", left, 925);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("png_failed");
  return new Uint8Array(await blob.arrayBuffer());
}
