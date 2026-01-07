"use client";

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
  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferences</CardTitle>
        <CardDescription>Customize your experience</CardDescription>
      </CardHeader>
      <CardContent>
        <PreferencesForm profile={profile} />
      </CardContent>
    </Card>
  );
}
