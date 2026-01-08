import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import type { Currency } from "@/types/database";
import {
  ProfileSection,
  PreferencesSection,
} from "@/components/account-settings";

export const metadata = {
  title: "Account Settings | Gold-Finger",
  description: "Manage your profile and preferences",
};

export default async function AccountSettingsPage() {
  const t = await getTranslations("accountSettings");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get profile
  const { data: profileData } = await supabase
    .from("profiles")
    .select("preferred_currency, theme")
    .eq("id", user?.id || "")
    .single();

  if (!user) {
    return null;
  }

  // Transform profile data: convert null to undefined for cleaner types
  const profile = profileData
    ? {
        preferred_currency:
          (profileData.preferred_currency as Currency) ?? undefined,
        theme: (profileData.theme as "light" | "dark" | "system") ?? undefined,
      }
    : undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
          {t("title")}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      <div className="grid gap-4 sm:gap-6">
        <ProfileSection
          user={{
            id: user.id,
            email: user.email || "",
            user_metadata: user.user_metadata,
          }}
        />

        <PreferencesSection profile={profile} />
      </div>
    </div>
  );
}
