import { getTranslations } from "next-intl/server";
import { SettingsContent } from "@/components/settings";

export const metadata = {
  title: "Settings | Gold-Finger",
  description: "Manage your account settings",
};

export default async function SettingsPage() {
  const t = await getTranslations("settings");

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

      <SettingsContent />
    </div>
  );
}
