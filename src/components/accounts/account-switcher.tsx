"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronsUpDown, Plus, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconBadge } from "@/components/ui/icon-picker";
import { cn } from "@/lib/utils";
import type { AccountWithRole } from "@/types/database";

interface AccountSwitcherProps {
  accounts: AccountWithRole[];
  currentAccountId?: string;
  onAccountChange?: (accountId: string) => void;
}

export function AccountSwitcher({
  accounts,
  currentAccountId,
  onAccountChange,
}: AccountSwitcherProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedId, setSelectedId] = useState(
    currentAccountId || accounts[0]?.id
  );

  const selectedAccount = accounts.find((a) => a.id === selectedId);

  useEffect(() => {
    // Sync with URL param
    const urlAccountId = searchParams.get("account");
    if (urlAccountId && accounts.some((a) => a.id === urlAccountId)) {
      setSelectedId(urlAccountId);
    }
  }, [searchParams, accounts]);

  const handleSelect = (accountId: string) => {
    setSelectedId(accountId);
    onAccountChange?.(accountId);

    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    params.set("account", accountId);
    router.push(`?${params.toString()}`);
  };

  if (accounts.length === 0) {
    return (
      <Button variant="outline" onClick={() => router.push("/accounts/new")}>
        <Plus className="mr-2 h-4 w-4" />
        Create Account
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-50 justify-between">
          <div className="flex items-center gap-2 truncate">
            <IconBadge
              icon={selectedAccount?.icon || "wallet"}
              color={selectedAccount?.color || "#6366f1"}
              size="sm"
            />
            <span className="truncate">{selectedAccount?.name}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-50">
        <DropdownMenuLabel>Your Accounts</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {accounts.map((account) => (
          <DropdownMenuItem
            key={account.id}
            onClick={() => handleSelect(account.id)}
            className="cursor-pointer"
          >
            <div className="flex items-center gap-2 flex-1">
              <IconBadge icon={account.icon || "wallet"} color={account.color} size="sm" />
              <span className="truncate">{account.name}</span>
              {account.role === "member" && (
                <Users className="h-3 w-3 text-muted-foreground ml-auto" />
              )}
            </div>
            <Check
              className={cn(
                "ml-2 h-4 w-4",
                selectedId === account.id ? "opacity-100" : "opacity-0"
              )}
            />
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => router.push("/accounts")}
          className="cursor-pointer"
        >
          <Plus className="mr-2 h-4 w-4" />
          Manage Accounts
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
