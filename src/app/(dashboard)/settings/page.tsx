import { SettingsContent } from "@/components/settings";

export const metadata = {
  title: "Settings | Gold-Finger",
  description: "Manage your account settings",
};

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
          Settings
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Manage your account settings
        </p>
      </div>

      <SettingsContent />
    </div>
  );
}
