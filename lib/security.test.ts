import { describe, expect, it } from "vitest";
import { decryptPublicToken, encryptPublicToken, hashToken } from "./security";

describe("public survey token persistence", () => {
  it("encrypts and restores an active QR token", () => {
    const token = "active-survey-token-for-qr-restoration";
    const encrypted = encryptPublicToken(token);

    expect(encrypted).not.toContain(token);
    expect(decryptPublicToken(encrypted)).toBe(token);
    expect(hashToken(decryptPublicToken(encrypted))).toBe(hashToken(token));
  });

  it("rejects malformed encrypted token data", () => {
    expect(() => decryptPublicToken("invalid")).toThrow("invalid_token_ciphertext");
  });
});
