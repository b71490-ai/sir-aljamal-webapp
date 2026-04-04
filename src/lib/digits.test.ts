import { describe, expect, it } from "vitest";
import { formatArabicDateWithEnglishDigits, normalizeToEnglishDigits } from "./digits";

describe("digits utilities", () => {
  it("converts Arabic and Persian digits to English digits", () => {
    expect(normalizeToEnglishDigits("٠١٢٣٤٥٦٧٨٩")).toBe("0123456789");
    expect(normalizeToEnglishDigits("۰۱۲۳۴۵۶۷۸۹")).toBe("0123456789");
    expect(normalizeToEnglishDigits("+٩٦٧٧٧٩٩٩٢٦٦٩")).toBe("+967779992669");
  });

  it("formats date using Latin digits in Arabic locale", () => {
    const formatted = formatArabicDateWithEnglishDigits("2026-04-03T10:25:00.000Z");
    expect(/[0-9]/.test(formatted)).toBe(true);
    expect(/[٠-٩۰-۹]/.test(formatted)).toBe(false);
  });
});
