import { describe, expect, it } from "vitest";
import { copy, locales, normalizeLocale } from "./i18n";

describe("survey translations", () => {
  it("provides seven questions and five scale labels for every supported language", () => {
    for (const locale of locales) {
      expect(copy[locale].questions).toHaveLength(7);
      expect(copy[locale].scale).toHaveLength(5);
    }
  });

  it("supports Japanese browser detection and falls back to Korean", () => {
    expect(normalizeLocale("ja-JP")).toBe("ja");
    expect(normalizeLocale("fr-FR")).toBe("ko");
  });
});
