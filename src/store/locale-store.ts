import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  type Locale,
  defaultLocale,
  isValidLocale,
  LOCALE_COOKIE_NAME,
  LOCALE_STORAGE_KEY,
} from "@/i18n/config";

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  syncWithUser: (userLocale?: string | null) => void;
}

// Helper to set the cookie (for SSR)
function setLocaleCookie(locale: Locale) {
  if (typeof document !== "undefined") {
    // Set cookie with 1 year expiry
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    document.cookie = `${LOCALE_COOKIE_NAME}=${locale};path=/;expires=${expires.toUTCString()};SameSite=Lax`;
  }
}

// Helper to detect browser language
function detectBrowserLocale(): Locale {
  if (typeof navigator === "undefined") return defaultLocale;

  const browserLang = navigator.language.split("-")[0];
  return isValidLocale(browserLang) ? browserLang : defaultLocale;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set, get) => ({
      locale: defaultLocale,

      setLocale: (locale: Locale) => {
        set({ locale });
        setLocaleCookie(locale);
        // Reload to apply new locale to server components
        if (typeof window !== "undefined") {
          window.location.reload();
        }
      },

      // Sync with user's database preference (called after login/on mount)
      syncWithUser: (userLocale?: string | null) => {
        if (userLocale && isValidLocale(userLocale)) {
          // User has a preference in DB, use it
          set({ locale: userLocale });
          setLocaleCookie(userLocale);
        } else {
          // No DB preference, use current localStorage value (or detect from browser)
          const currentLocale = get().locale;
          setLocaleCookie(currentLocale);
        }
      },
    }),
    {
      name: LOCALE_STORAGE_KEY,
      // Only persist the locale field
      partialize: (state) => ({ locale: state.locale }),
      // On first load, if no stored value, detect from browser
      onRehydrateStorage: () => (state) => {
        if (state && !state.locale) {
          const detected = detectBrowserLocale();
          state.locale = detected;
          setLocaleCookie(detected);
        } else if (state) {
          // Ensure cookie is set on rehydrate
          setLocaleCookie(state.locale);
        }
      },
    },
  ),
);
