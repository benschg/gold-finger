"use client";

import { MoreHorizontal, Users, Trash2, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Tables } from "@/types/database.types";

type Account = Tables<"accounts">;

interface AccountWithRole extends Account {
  role: "owner" | "member";
}

interface AccountCardProps {
  account: AccountWithRole;
  onDelete?: (account: AccountWithRole) => void;
  onManage?: (account: AccountWithRole) => void;
}

export function AccountCard({ account, onDelete, onManage }: AccountCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-lg font-medium">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full text-white text-sm"
            style={{ backgroundColor: account.color ?? "#6366f1" }}
          >
            {account.name.charAt(0).toUpperCase()}
          </span>
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
              Manage
            </DropdownMenuItem>
            {account.role === "owner" && (
              <DropdownMenuItem
                onClick={() => onDelete?.(account)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>
            {account.role === "owner" ? "Owner" : "Member"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
