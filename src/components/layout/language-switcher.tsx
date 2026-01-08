"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocaleStore } from "@/store/locale-store";
import { type Locale, localeNames, publicLocales } from "@/i18n/config";

// Hydration-safe hook to detect client-side mounting
function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function LanguageSwitcher() {
  const t = useTranslations("settings");
  const { locale, setLocale } = useLocaleStore();
  const hydrated = useHydrated();

  const handleLocaleChange = (newLocale: Locale) => {
    if (newLocale !== locale) {
      setLocale(newLocale);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-9 gap-1.5 px-2">
          <Globe className="h-4 w-4" />
          {hydrated && (
            <span className="text-xs font-medium uppercase">{locale}</span>
          )}
          <span className="sr-only">{t("language")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {publicLocales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => handleLocaleChange(loc)}
            className={locale === loc ? "bg-accent" : ""}
          >
            {localeNames[loc]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
