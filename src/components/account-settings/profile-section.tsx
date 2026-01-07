"use client";

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
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Your profile information</CardDescription>
      </CardHeader>
      <CardContent>
        <ProfileForm user={user} />
      </CardContent>
    </Card>
  );
}
