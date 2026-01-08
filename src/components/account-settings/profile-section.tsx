"use client";

import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProfileForm } from "@/components/settings/profile-form";

interface ProfileSectionProps {
  user: {
    id: string;
    email: string;
    user_metadata?: {
      avatar_url?: string;
      display_name?: string;
    };
  };
}

export function ProfileSection({ user }: ProfileSectionProps) {
  const t = useTranslations("settings");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("profile")}</CardTitle>
        <CardDescription>{t("profileInfo")}</CardDescription>
      </CardHeader>
      <CardContent>
        <ProfileForm user={user} />
      </CardContent>
    </Card>
  );
}
