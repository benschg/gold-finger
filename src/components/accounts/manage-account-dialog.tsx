"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconPicker, ColorPicker } from "@/components/ui/icon-picker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MemberList } from "./member-list";
import { InviteForm } from "./invite-form";
import { InvitationList } from "./invitation-list";
import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  ACCOUNT_COLORS,
  DEFAULT_ACCOUNT_COLOR,
} from "@/lib/constants";
import type { Tables } from "@/types/database.types";
import type { Currency } from "@/types/database";

type Account = Tables<"accounts">;

interface AccountWithRole extends Account {
  role: "owner" | "member";
}

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

type Invitation = Tables<"account_invitations">;

interface ManageAccountDialogProps {
  account: AccountWithRole | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  currentUserId: string;
}

export function ManageAccountDialog({
  account,
  open,
  onOpenChange,
  onSuccess,
  currentUserId,
}: ManageAccountDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("wallet");
  const [color, setColor] = useState<string>(DEFAULT_ACCOUNT_COLOR);
  const [currency, setCurrency] = useState<Currency>(DEFAULT_CURRENCY);
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);

  const fetchAccountDetails = useCallback(async () => {
    if (!account) return;

    setIsLoading(true);
    try {
      // Fetch account details with members
      const accountRes = await fetch(`/api/accounts/${account.id}`);
      if (accountRes.ok) {
        const data = await accountRes.json();
        setMembers(data.members || []);
      }

      // Fetch sent invitations (only for owners)
      if (account.role === "owner") {
        const inviteRes = await fetch(`/api/accounts/${account.id}/invite`);
        if (inviteRes.ok) {
          const data = await inviteRes.json();
          setInvitations(data);
        }
      }
    } catch (error) {
      console.error("Error fetching account details:", error);
    } finally {
      setIsLoading(false);
    }
  }, [account]);

  useEffect(() => {
    if (account && open) {
      setName(account.name);
      setIcon(account.icon ?? "wallet");
      setColor(account.color ?? DEFAULT_ACCOUNT_COLOR);
      setCurrency((account.currency as Currency) ?? DEFAULT_CURRENCY);
      fetchAccountDetails();
    }
  }, [account, open, fetchAccountDetails]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !name.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/accounts/${account.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          icon,
          color,
          currency,
        }),
      });

      if (response.ok) {
        onOpenChange(false);
        onSuccess?.();
      }
    } catch (error) {
      console.error("Error updating account:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefresh = () => {
    fetchAccountDetails();
    onSuccess?.();
  };

  if (!account) return null;

  const isOwner = account.role === "owner";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Account</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Account Settings - Only owners can edit */}
            {isOwner && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="account-name">Account Name</Label>
                  <Input
                    id="account-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Personal, Household, Work"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="account-currency">Default Currency</Label>
                  <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
                    <SelectTrigger id="account-currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.symbol} {c.label} ({c.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Icon</Label>
                  <IconPicker
                    value={icon}
                    onChange={setIcon}
                    placeholder="Select an icon..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Color</Label>
                  <ColorPicker
                    value={color}
                    onChange={setColor}
                    colors={ACCOUNT_COLORS}
                    icon={icon}
                    columns={5}
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isSubmitting || !name.trim()}>
                    {isSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save Changes
                  </Button>
                </div>
              </form>
            )}

            {isOwner && <hr className="border-border" />}

            {/* Members Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <h3 className="font-medium">Members</h3>
              </div>
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
                  <InviteForm
                    accountId={account.id}
                    onInviteSent={handleRefresh}
                  />

                  {invitations.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground">
                        Pending Invitations
                      </h4>
                      <InvitationList
                        invitations={invitations}
                        mode="sent"
                        accountId={account.id}
                        onAction={handleRefresh}
                      />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
