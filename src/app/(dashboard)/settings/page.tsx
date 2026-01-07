import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  SettingsCategoriesTags,
  PendingInvitations,
} from "@/components/settings";

export const metadata = {
  title: "Settings | Gold-Finger",
  description: "Manage categories, tags, and invitations",
};

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Manage categories, tags, and invitations
        </p>
      </div>

      <div className="grid gap-4 sm:gap-6">
        {/* Pending Invitations */}
        <Card>
          <CardHeader>
            <CardTitle>Account Invitations</CardTitle>
            <CardDescription>
              Invitations to join shared expense accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PendingInvitations />
          </CardContent>
        </Card>

        {/* Categories & Tags */}
        <SettingsCategoriesTags />
      </div>
    </div>
  );
}
