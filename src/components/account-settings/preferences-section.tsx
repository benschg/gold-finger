"use client";

import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PreferencesForm } from "@/components/settings/preferences-form";
import type { Currency } from "@/types/database";

interface PreferencesSectionProps {
  profile?: {
    preferred_currency?: Currency;
    theme?: "light" | "dark" | "system";
  };
}

export function PreferencesSection({ profile }: PreferencesSectionProps) {
  const t = useTranslations("settings");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("preferences")}</CardTitle>
        <CardDescription>{t("customizeExperience")}</CardDescription>
      </CardHeader>
      <CardContent>
        <PreferencesForm profile={profile} />
      </CardContent>
    </Card>
  );
}
