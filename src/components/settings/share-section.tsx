"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

import { MemberList, InviteForm, InvitationList } from "@/components/accounts";
import type { AccountWithRole, AccountRole } from "@/types/database";
import type { Tables } from "@/types/database.types";

interface Member {
  user_id: string;
  role: AccountRole;
  joined_at: string;
  email?: string;
  profile?: {
    id: string;
    avatar_url?: string;
  };
}

type Invitation = Tables<"account_invitations">;

interface ShareSectionProps {
  account: AccountWithRole;
  currentUserId: string;
  onSuccess?: () => void;
}

export function ShareSection({
  account,
  currentUserId,
  onSuccess,
}: ShareSectionProps) {
  const t = useTranslations("invitations");

  const [isLoading, setIsLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);

  const isOwner = account.role === "owner";

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch account details with members
      const accountRes = await fetch(`/api/accounts/${account.id}`);
      if (accountRes.ok) {
        const data = await accountRes.json();
        setMembers(data.members || []);
      }

      // Fetch sent invitations (only for owners)
      if (isOwner) {
        const inviteRes = await fetch(`/api/accounts/${account.id}/invite`);
        if (inviteRes.ok) {
          const data = await inviteRes.json();
          setInvitations(data);
        }
      }
    } catch (error) {
      console.error("Error fetching share data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [account.id, isOwner]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    fetchData();
    onSuccess?.();
  };

  if (isLoading) {
    return (
      <div className="flex h-20 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Members Section */}
      <div className="space-y-4">
        <MemberList
          accountId={account.id}
          members={members}
          currentUserId={currentUserId}
          currentUserRole={account.role}
          onMemberRemoved={handleRefresh}
        />
      </div>

      {/* Invite Section - Only for owners */}
      {isOwner && (
        <>
          <hr className="border-border" />
          <div className="space-y-4">
            <InviteForm accountId={account.id} onInviteSent={handleRefresh} />

            {invitations.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                  {t("title")}
                </h4>
                <InvitationList
                  invitations={invitations}
                  mode="sent"
                  onAction={handleRefresh}
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
