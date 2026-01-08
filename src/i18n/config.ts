export const locales = ["en", "de", "pt", "kn"] as const;
export const publicLocales = ["en", "de", "pt"] as const; // Shown in UI (not dev-only kn)
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  de: "Deutsch",
  pt: "Português",
  kn: "ಕನ್ನಡ (Dev)",
};

// Cookie name for storing locale preference
export const LOCALE_COOKIE_NAME = "NEXT_LOCALE";

// localStorage key for storing locale preference
export const LOCALE_STORAGE_KEY = "gold-finger-locale";

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}
