import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  SettingsCategoriesTags,
  ProfileForm,
  PreferencesForm,
  PendingInvitations,
} from "@/components/settings";

export const metadata = {
  title: "Settings | Gold-Finger",
  description: "Manage your account settings",
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("preferred_currency, theme")
    .eq("id", user?.id || "")
    .single();

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and preferences
        </p>
      </div>

      <div className="grid gap-6">
        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your profile information</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm
              user={{
                id: user.id,
                email: user.email || "",
                user_metadata: user.user_metadata,
              }}
            />
          </CardContent>
        </Card>

        {/* Preferences Section */}
        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>Customize your experience</CardDescription>
          </CardHeader>
          <CardContent>
            <PreferencesForm profile={profile || undefined} />
          </CardContent>
        </Card>

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
