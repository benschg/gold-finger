import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";

// Mock zustand persist middleware
vi.mock("zustand/middleware", () => ({
  persist: (fn: unknown) => fn,
}));

// Store state for testing (reset between tests)
let mockLocale = "en";

// Mock the actual store module
vi.mock("@/store/locale-store", () => ({
  useLocaleStore: vi.fn(() => ({
    locale: mockLocale,
    setLocale: vi.fn((locale: string) => {
      mockLocale = locale;
    }),
    syncWithUser: vi.fn((userLocale?: string | null) => {
      if (userLocale && ["en", "de", "pt", "kn"].includes(userLocale)) {
        mockLocale = userLocale;
      }
    }),
  })),
}));

// Import after mocking
import { useLocaleStore } from "@/store/locale-store";

describe("locale-store", () => {
  beforeEach(() => {
    mockLocale = "en";
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("useLocaleStore", () => {
    it("returns the current locale", () => {
      const { result } = renderHook(() => useLocaleStore());
      expect(result.current.locale).toBe("en");
    });

    it("provides setLocale function", () => {
      const { result } = renderHook(() => useLocaleStore());
      expect(typeof result.current.setLocale).toBe("function");
    });

    it("provides syncWithUser function", () => {
      const { result } = renderHook(() => useLocaleStore());
      expect(typeof result.current.syncWithUser).toBe("function");
    });
  });
});

describe("i18n/config", () => {
  // Test the config exports directly
  it("defines supported locales", async () => {
    const { locales, publicLocales, defaultLocale } =
      await import("@/i18n/config");
    expect(locales).toEqual(["en", "de", "pt", "kn"]);
    expect(publicLocales).toEqual(["en", "de", "pt"]);
    expect(defaultLocale).toBe("en");
  });

  it("defines locale names", async () => {
    const { localeNames } = await import("@/i18n/config");
    expect(localeNames.en).toBe("English");
    expect(localeNames.de).toBe("Deutsch");
    expect(localeNames.pt).toBe("Português");
    expect(localeNames.kn).toBe("ಕನ್ನಡ (Dev)");
  });

  it("validates locales correctly", async () => {
    const { isValidLocale } = await import("@/i18n/config");
    expect(isValidLocale("en")).toBe(true);
    expect(isValidLocale("de")).toBe(true);
    expect(isValidLocale("pt")).toBe(true);
    expect(isValidLocale("kn")).toBe(true);
    expect(isValidLocale("fr")).toBe(false);
    expect(isValidLocale("invalid")).toBe(false);
    expect(isValidLocale("")).toBe(false);
  });

  it("defines cookie and storage keys", async () => {
    const { LOCALE_COOKIE_NAME, LOCALE_STORAGE_KEY } =
      await import("@/i18n/config");
    expect(LOCALE_COOKIE_NAME).toBe("NEXT_LOCALE");
    expect(LOCALE_STORAGE_KEY).toBe("gold-finger-locale");
  });
});
