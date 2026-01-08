"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Crown, MoreVertical, UserMinus, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Member {
  user_id: string;
  role: "owner" | "member";
  joined_at: string;
  email?: string;
  profile?: {
    id: string;
    avatar_url?: string;
  };
}

interface MemberListProps {
  accountId: string;
  members: Member[];
  currentUserId: string;
  currentUserRole: "owner" | "member";
  onMemberRemoved?: () => void;
}

export function MemberList({
  accountId,
  members,
  currentUserId,
  currentUserRole,
  onMemberRemoved,
}: MemberListProps) {
  const t = useTranslations("members");
  const tc = useTranslations("common");
  const router = useRouter();
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);

  const handleRemoveMember = async (userId: string) => {
    setIsRemoving(userId);
    const isLeavingAccount = userId === currentUserId;
    try {
      const response = await fetch(
        `/api/accounts/${accountId}/members?user_id=${userId}`,
        { method: "DELETE" },
      );

      if (response.ok) {
        onMemberRemoved?.();
        router.refresh();
        toast.success(isLeavingAccount ? t("leftAccount") : t("memberRemoved"));
      } else {
        const error = await response.json();
        toast.error(error.error || t("failedToRemove"));
      }
    } catch {
      toast.error(t("failedToRemove"));
    } finally {
      setIsRemoving(null);
      setMemberToRemove(null);
    }
  };

  return (
    <>
      <div className="space-y-2">
        {members.map((member) => {
          const isCurrentUser = member.user_id === currentUserId;
          const canRemove =
            currentUserRole === "owner" ||
            (isCurrentUser && currentUserRole === "member");

          return (
            <div
              key={member.user_id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={member.profile?.avatar_url} />
                  <AvatarFallback>
                    {member.email?.substring(0, 2).toUpperCase() || "??"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {member.email || "User"}
                      {isCurrentUser && (
                        <span className="text-muted-foreground">
                          {" "}
                          {tc("you")}
                        </span>
                      )}
                    </span>
                    {member.role === "owner" && (
                      <Crown className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {member.role === "owner" ? tc("owner") : tc("member")} ·{" "}
                    {tc("joined")}{" "}
                    {new Date(member.joined_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {canRemove && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      {isRemoving === member.user_id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MoreVertical className="h-4 w-4" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => setMemberToRemove(member)}
                      className="text-destructive focus:text-destructive"
                    >
                      <UserMinus className="mr-2 h-4 w-4" />
                      {isCurrentUser
                        ? t("leaveAccountAction")
                        : t("removeMemberAction")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          );
        })}
      </div>

      <AlertDialog
        open={!!memberToRemove}
        onOpenChange={() => setMemberToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {memberToRemove?.user_id === currentUserId
                ? t("leaveAccount")
                : t("removeMember")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {memberToRemove?.user_id === currentUserId
                ? t("leaveAccountConfirm")
                : t("removeMemberConfirm")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                memberToRemove && handleRemoveMember(memberToRemove.user_id)
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {memberToRemove?.user_id === currentUserId
                ? t("leave")
                : t("remove")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
