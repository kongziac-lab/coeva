import { describe, expect, it } from "vitest";
import { crc32, createZip, safeFileName } from "./zip";

describe("stored zip writer", () => {
  it("computes the standard CRC-32", () => {
    expect(crc32(new TextEncoder().encode("123456789"))).toBe(0xcbf43926);
  });

  it("writes local headers, central directory and end record with UTF-8 names", () => {
    const zip = createZip([
      { name: "134반_301호.png", data: new Uint8Array([1, 2, 3]) },
      { name: "135반_205호.png", data: new Uint8Array([4, 5]) },
    ], new Date(2026, 10, 6, 10, 30, 0));
    const view = new DataView(zip.buffer);
    expect(view.getUint32(0, true)).toBe(0x04034b50);
    expect(view.getUint16(6, true) & 0x0800).toBe(0x0800);
    const endOffset = zip.length - 22;
    expect(view.getUint32(endOffset, true)).toBe(0x06054b50);
    expect(view.getUint16(endOffset + 10, true)).toBe(2);
    const centralOffset = view.getUint32(endOffset + 16, true);
    expect(view.getUint32(centralOffset, true)).toBe(0x02014b50);
    const nameLength = view.getUint16(centralOffset + 28, true);
    expect(new TextDecoder().decode(zip.slice(centralOffset + 46, centralOffset + 46 + nameLength))).toBe("134반_301호.png");
  });

  it("replaces characters that are not allowed in file names", () => {
    expect(safeFileName('A/B:C*?"<>|.png')).toBe("A_B_C______.png");
  });
});
