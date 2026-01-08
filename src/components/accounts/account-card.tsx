"use client";

import { useTranslations } from "next-intl";
import { MoreHorizontal, Users, Trash2, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconBadge } from "@/components/ui/icon-picker";
import type { AccountWithRole } from "@/types/database";

interface AccountCardProps {
  account: AccountWithRole;
  onDelete?: (account: AccountWithRole) => void;
  onManage?: (account: AccountWithRole) => void;
}

export function AccountCard({ account, onDelete, onManage }: AccountCardProps) {
  const t = useTranslations("accounts");
  const tc = useTranslations("common");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-lg font-medium">
          <IconBadge
            icon={account.icon ?? "wallet"}
            color={account.color ?? "#6366f1"}
            size="lg"
          />
          {account.name}
        </CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onManage?.(account)}>
              <Settings className="mr-2 h-4 w-4" />
              {t("manage")}
            </DropdownMenuItem>
            {account.role === "owner" && (
              <DropdownMenuItem
                onClick={() => onDelete?.(account)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {tc("delete")}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{account.role === "owner" ? tc("owner") : tc("member")}</span>
        </div>
      </CardContent>
    </Card>
  );
}
