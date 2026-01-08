"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Clock, X, Check, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { IconBadge } from "@/components/ui/icon-picker";
import type { Tables } from "@/types/database.types";

type Invitation = Tables<"account_invitations"> & {
  account?: Pick<Tables<"accounts">, "id" | "name" | "icon" | "color">;
};

interface InvitationListProps {
  invitations: Invitation[];
  mode: "sent" | "received";
  onAction?: () => void;
}

export function InvitationList({
  invitations,
  mode,
  onAction,
}: InvitationListProps) {
  const t = useTranslations("invitations");
  const tc = useTranslations("common");
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
        toast.success(t("accepted"));
      } else {
        const data = await response.json();
        toast.error(data.error || t("acceptFailed"));
      }
    } catch {
      toast.error(t("acceptFailed"));
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
        toast.success(t("declined"));
      } else {
        const data = await response.json();
        toast.error(data.error || t("declineFailed"));
      }
    } catch {
      toast.error(t("declineFailed"));
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
        toast.success(t("cancelled"));
      } else {
        const data = await response.json();
        toast.error(data.error || t("cancelFailed"));
      }
    } catch {
      toast.error(t("cancelFailed"));
    } finally {
      setLoadingId(null);
      setAction(null);
    }
  };

  if (invitations.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        {mode === "sent" ? t("noPending") : t("noInvitations")}
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
                <IconBadge
                  icon={invitation.account.icon ?? "wallet"}
                  color={invitation.account.color ?? "#6366f1"}
                  size="lg"
                />
              )}
              <div>
                <p className="font-medium">
                  {mode === "sent"
                    ? invitation.invitee_email
                    : invitation.account?.name || "Account"}
                </p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {tc("expires")}{" "}
                  {invitation.expires_at &&
                    formatDistanceToNow(new Date(invitation.expires_at), {
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
                    <span className="ml-1 hidden sm:inline">
                      {t("decline")}
                    </span>
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
                    <span className="ml-1 hidden sm:inline">{t("accept")}</span>
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
                  <span className="ml-1">{tc("cancel")}</span>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
