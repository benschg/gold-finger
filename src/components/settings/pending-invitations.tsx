"use client";

import { useState, useEffect } from "react";
import { InvitationList } from "@/components/accounts/invitation-list";
import type { Tables } from "@/types/database.types";

type Invitation = Tables<"account_invitations"> & {
  account?: Pick<Tables<"accounts">, "id" | "name" | "icon" | "color">;
};

export function PendingInvitations() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInvitations = async () => {
    try {
      const response = await fetch("/api/invitations");
      if (response.ok) {
        const data = await response.json();
        setInvitations(data);
      }
    } catch (error) {
      console.error("Failed to fetch invitations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground py-4">
        Loading invitations...
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No pending invitations to join shared accounts.
      </p>
    );
  }

  return (
    <InvitationList
      invitations={invitations}
      mode="received"
      onAction={fetchInvitations}
    />
  );
}
