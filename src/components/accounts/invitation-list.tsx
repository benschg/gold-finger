"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, X, Check, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Tables } from "@/types/database.types";

type Invitation = Tables<"account_invitations"> & {
  account?: Pick<Tables<"accounts">, "id" | "name" | "icon" | "color">;
};

interface InvitationListProps {
  invitations: Invitation[];
  mode: "sent" | "received";
  accountId?: string;
  onAction?: () => void;
}

export function InvitationList({
  invitations,
  mode,
  accountId,
  onAction,
}: InvitationListProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [action, setAction] = useState<"accept" | "decline" | null>(null);

  const handleAccept = async (invitationId: string) => {
    setLoadingId(invitationId);
    setAction("accept");
    try {
      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: "POST",
      });

      if (response.ok) {
        onAction?.();
        router.refresh();
        toast.success("Invitation accepted");
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to accept invitation");
      }
    } catch {
      toast.error("Failed to accept invitation");
    } finally {
      setLoadingId(null);
      setAction(null);
    }
  };

  const handleDecline = async (invitationId: string) => {
    setLoadingId(invitationId);
    setAction("decline");
    try {
      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onAction?.();
        router.refresh();
        toast.success("Invitation declined");
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to decline invitation");
      }
    } catch {
      toast.error("Failed to decline invitation");
    } finally {
      setLoadingId(null);
      setAction(null);
    }
  };

  const handleCancel = async (invitationId: string) => {
    setLoadingId(invitationId);
    setAction("decline");
    try {
      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onAction?.();
        router.refresh();
        toast.success("Invitation cancelled");
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to cancel invitation");
      }
    } catch {
      toast.error("Failed to cancel invitation");
    } finally {
      setLoadingId(null);
      setAction(null);
    }
  };

  if (invitations.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        {mode === "sent"
          ? "No pending invitations"
          : "No invitations to join accounts"}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {invitations.map((invitation) => (
        <Card key={invitation.id}>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              {mode === "received" && invitation.account && (
                <span
                  className="h-8 w-8 rounded-full flex items-center justify-center text-white font-medium"
                  style={{ backgroundColor: invitation.account.color ?? "#6366f1" }}
                >
                  {invitation.account.name.charAt(0).toUpperCase()}
                </span>
              )}
              <div>
                <p className="font-medium">
                  {mode === "sent"
                    ? invitation.invitee_email
                    : invitation.account?.name || "Account"}
                </p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Expires{" "}
                  {invitation.expires_at && formatDistanceToNow(new Date(invitation.expires_at), {
                    addSuffix: true,
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {mode === "received" ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDecline(invitation.id)}
                    disabled={loadingId === invitation.id}
                  >
                    {loadingId === invitation.id && action === "decline" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                    <span className="ml-1 hidden sm:inline">Decline</span>
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleAccept(invitation.id)}
                    disabled={loadingId === invitation.id}
                  >
                    {loadingId === invitation.id && action === "accept" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    <span className="ml-1 hidden sm:inline">Accept</span>
                  </Button>
                </>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCancel(invitation.id)}
                  disabled={loadingId === invitation.id}
                >
                  {loadingId === invitation.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                  <span className="ml-1">Cancel</span>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
