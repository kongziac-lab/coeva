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

  it("lists the twelve languages in the requested order and detects the new ones", () => {
    expect(locales).toEqual(["ko", "en", "vi", "mn", "my", "si", "ne", "zh", "ja", "id", "th", "uz"]);
    expect(normalizeLocale("my-MM")).toBe("my");
    expect(normalizeLocale("si_LK")).toBe("si");
    expect(normalizeLocale("ne-NP")).toBe("ne");
    expect(normalizeLocale("in-ID")).toBe("id");
    expect(normalizeLocale("th-TH")).toBe("th");
    expect(normalizeLocale("uz-Latn-UZ")).toBe("uz");
  });

  it("fills every message for every language", () => {
    for (const locale of locales) {
      for (const [key, value] of Object.entries(copy[locale])) {
        if (key === "instructorSuffix") continue;
        if (Array.isArray(value)) expect(value.every((item) => String(item).trim().length > 0)).toBe(true);
        else expect(String(value).trim().length, `${locale}.${key}`).toBeGreaterThan(0);
      }
    }
  });
});
