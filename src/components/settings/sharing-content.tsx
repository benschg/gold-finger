"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShareSection } from "./share-section";
import { PendingInvitations } from "./pending-invitations";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { useAccountStore } from "@/store/account-store";
import { createClient } from "@/lib/supabase/client";

export function SharingContent() {
  const t = useTranslations("invitations");
  const tMembers = useTranslations("members");

  const [userId, setUserId] = useState<string | null>(null);
  const {
    accounts,
    isLoading: isLoadingAccounts,
    refetch: refetchAccounts,
  } = useAccounts();
  const { selectedAccountId } = useAccountStore();

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null);
    });
  }, []);

  if (isLoadingAccounts) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Invitations */}
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <PendingInvitations />
        </CardContent>
      </Card>

      {/* Share Section */}
      {selectedAccount && userId ? (
        <Card>
          <CardHeader>
            <CardTitle>{tMembers("title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ShareSection
              account={selectedAccount}
              currentUserId={userId}
              onSuccess={refetchAccounts}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{tMembers("title")}</CardTitle>
          </CardHeader>
          <CardContent className="py-4 text-center text-muted-foreground">
            Select an account to manage sharing settings.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
