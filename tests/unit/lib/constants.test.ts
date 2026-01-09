import { describe, expect, it } from "vitest";
import {
  ACCOUNT_COLORS,
  DEFAULT_ACCOUNT_COLOR,
  CATEGORY_COLORS,
  DEFAULT_CATEGORY_COLOR,
  CURRENCIES,
  DEFAULT_CURRENCY,
  CURRENCY_SYMBOLS,
  getCurrencySymbol,
  formatCurrency,
} from "@/lib/constants";

describe("Color Constants", () => {
  describe("ACCOUNT_COLORS", () => {
    it("should contain valid hex colors", () => {
      const hexRegex = /^#[0-9A-Fa-f]{6}$/;
      ACCOUNT_COLORS.forEach((color) => {
        expect(color).toMatch(hexRegex);
      });
    });

    it("should have at least 5 colors for variety", () => {
      expect(ACCOUNT_COLORS.length).toBeGreaterThanOrEqual(5);
    });

    it("should have unique colors", () => {
      const uniqueColors = new Set(ACCOUNT_COLORS);
      expect(uniqueColors.size).toBe(ACCOUNT_COLORS.length);
    });
  });

  describe("DEFAULT_ACCOUNT_COLOR", () => {
    it("should be a valid hex color", () => {
      const hexRegex = /^#[0-9A-Fa-f]{6}$/;
      expect(DEFAULT_ACCOUNT_COLOR).toMatch(hexRegex);
    });

    it("should be included in ACCOUNT_COLORS", () => {
      expect(ACCOUNT_COLORS).toContain(DEFAULT_ACCOUNT_COLOR);
    });

    it("should be the first color in the array", () => {
      expect(DEFAULT_ACCOUNT_COLOR).toBe(ACCOUNT_COLORS[0]);
    });
  });

  describe("CATEGORY_COLORS", () => {
    it("should contain valid hex colors", () => {
      const hexRegex = /^#[0-9A-Fa-f]{6}$/;
      CATEGORY_COLORS.forEach((color) => {
        expect(color).toMatch(hexRegex);
      });
    });

    it("should have at least 10 colors for variety", () => {
      expect(CATEGORY_COLORS.length).toBeGreaterThanOrEqual(10);
    });

    it("should have unique colors", () => {
      const uniqueColors = new Set(CATEGORY_COLORS);
      expect(uniqueColors.size).toBe(CATEGORY_COLORS.length);
    });
  });

  describe("DEFAULT_CATEGORY_COLOR", () => {
    it("should be a valid hex color", () => {
      const hexRegex = /^#[0-9A-Fa-f]{6}$/;
      expect(DEFAULT_CATEGORY_COLOR).toMatch(hexRegex);
    });

    it("should be included in CATEGORY_COLORS", () => {
      expect(CATEGORY_COLORS).toContain(DEFAULT_CATEGORY_COLOR);
    });

    it("should be the first color in the array", () => {
      expect(DEFAULT_CATEGORY_COLOR).toBe(CATEGORY_COLORS[0]);
    });
  });
});

describe("Currency Constants", () => {
  describe("CURRENCIES", () => {
    it("should have required properties for each currency", () => {
      CURRENCIES.forEach((currency) => {
        expect(currency).toHaveProperty("code");
        expect(currency).toHaveProperty("symbol");
        expect(currency).toHaveProperty("label");
      });
    });

    it("should have unique currency codes", () => {
      const codes = CURRENCIES.map((c) => c.code);
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(CURRENCIES.length);
    });

    it("should include common currencies", () => {
      const codes = CURRENCIES.map((c) => c.code);
      expect(codes).toContain("EUR");
      expect(codes).toContain("USD");
      expect(codes).toContain("GBP");
    });

    it("should have non-empty symbols", () => {
      CURRENCIES.forEach((currency) => {
        expect(currency.symbol.length).toBeGreaterThan(0);
      });
    });
  });

  describe("DEFAULT_CURRENCY", () => {
    it("should be a valid currency code", () => {
      const codes = CURRENCIES.map((c) => c.code);
      expect(codes).toContain(DEFAULT_CURRENCY);
    });

    it("should be EUR", () => {
      expect(DEFAULT_CURRENCY).toBe("EUR");
    });
  });

  describe("CURRENCY_SYMBOLS", () => {
    it("should have entries for all currencies", () => {
      CURRENCIES.forEach((currency) => {
        expect(CURRENCY_SYMBOLS).toHaveProperty(currency.code);
        expect(CURRENCY_SYMBOLS[currency.code]).toBe(currency.symbol);
      });
    });
  });

  describe("getCurrencySymbol", () => {
    it("should return symbol for known currencies", () => {
      expect(getCurrencySymbol("EUR")).toBe("€");
      expect(getCurrencySymbol("USD")).toBe("$");
      expect(getCurrencySymbol("GBP")).toBe("£");
      expect(getCurrencySymbol("JPY")).toBe("¥");
      expect(getCurrencySymbol("CHF")).toBe("CHF");
    });

    it("should return the code itself for unknown currencies", () => {
      expect(getCurrencySymbol("XYZ")).toBe("XYZ");
      expect(getCurrencySymbol("ABC")).toBe("ABC");
    });
  });

  describe("formatCurrency", () => {
    it("should format amount with currency symbol", () => {
      const result = formatCurrency(1234.56, "EUR");
      expect(result).toContain("€");
      expect(result).toContain("1");
      expect(result).toContain("234");
    });

    it("should use EUR as default currency", () => {
      const result = formatCurrency(100);
      expect(result).toContain("€");
    });

    it("should format with 2 decimal places by default", () => {
      const result = formatCurrency(100, "EUR");
      expect(result).toMatch(/100[.,]00/);
    });

    it("should respect custom decimal places", () => {
      const result = formatCurrency(100, "EUR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
      expect(result).not.toMatch(/[.,]\d{2}$/);
    });

    it("should add plus sign when showPlusSign is true and amount is positive", () => {
      const result = formatCurrency(100, "EUR", { showPlusSign: true });
      expect(result).toMatch(/^\+/);
    });

    it("should not add plus sign for negative amounts", () => {
      const result = formatCurrency(-100, "EUR", { showPlusSign: true });
      expect(result).not.toMatch(/^\+/);
    });

    it("should add plus sign for zero when showPlusSign is true", () => {
      const result = formatCurrency(0, "EUR", { showPlusSign: true });
      expect(result).toMatch(/^\+/);
    });

    it("should format different currencies correctly", () => {
      expect(formatCurrency(100, "USD")).toContain("$");
      expect(formatCurrency(100, "GBP")).toContain("£");
      expect(formatCurrency(100, "JPY")).toContain("¥");
    });
  });
});
