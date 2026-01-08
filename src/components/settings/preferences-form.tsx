"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { CURRENCIES, DEFAULT_CURRENCY } from "@/lib/constants";
import type { Currency } from "@/types/database";
import { useLocaleStore } from "@/store/locale-store";
import { type Locale, localeNames, publicLocales } from "@/i18n/config";

interface PreferencesFormProps {
  profile?: {
    preferred_currency?: Currency;
    theme?: "light" | "dark" | "system";
  };
}

export function PreferencesForm({ profile }: PreferencesFormProps) {
  const router = useRouter();
  const t = useTranslations("settings");
  const { theme: currentTheme, setTheme } = useTheme();
  const { locale, setLocale } = useLocaleStore();
  const [currency, setCurrency] = useState<Currency>(
    profile?.preferred_currency || DEFAULT_CURRENCY,
  );
  const [selectedTheme, setSelectedTheme] = useState(
    profile?.theme || currentTheme || "system",
  );
  const [selectedLocale, setSelectedLocale] = useState<Locale>(locale);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleThemeChange = (value: string) => {
    setSelectedTheme(value);
    setTheme(value);
  };

  const handleLocaleChange = (value: Locale) => {
    setSelectedLocale(value);
    setLocale(value);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update({
          preferred_currency: currency,
          theme: selectedTheme as "light" | "dark" | "system",
        })
        .eq("id", user.id);

      if (error) throw error;

      setMessage({ type: "success", text: t("preferencesSaved") });
      router.refresh();
    } catch (error) {
      console.error("Save error:", error);
      setMessage({ type: "error", text: t("preferencesFailed") });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid gap-4 max-w-full sm:max-w-md">
      <div className="space-y-2">
        <Label htmlFor="currency">{t("defaultCurrency")}</Label>
        <Select
          value={currency}
          onValueChange={(v) => setCurrency(v as Currency)}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("defaultCurrency")} />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.symbol} {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="theme">{t("theme")}</Label>
        <Select value={selectedTheme} onValueChange={handleThemeChange}>
          <SelectTrigger>
            <SelectValue placeholder={t("theme")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="light">{t("themeLight")}</SelectItem>
            <SelectItem value="dark">{t("themeDark")}</SelectItem>
            <SelectItem value="system">{t("themeSystem")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="language">{t("language")}</Label>
        <Select value={selectedLocale} onValueChange={handleLocaleChange}>
          <SelectTrigger>
            <SelectValue placeholder={t("language")} />
          </SelectTrigger>
          <SelectContent>
            {publicLocales.map((loc) => (
              <SelectItem key={loc} value={loc}>
                {localeNames[loc]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button onClick={handleSave} disabled={isSaving} className="w-fit">
        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {t("savePreferences")}
      </Button>

      {message && (
        <p
          className={`text-sm ${
            message.type === "success" ? "text-green-600" : "text-destructive"
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
