"use client";

import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IconBadge } from "@/components/ui/icon-picker";
import type { AccountWithRole } from "@/types/database";

interface AccountSelectorProps {
  accounts: AccountWithRole[];
  value: string | null;
  onValueChange: (value: string) => void;
  placeholder?: string;
  showIcon?: boolean;
  className?: string;
}

export function AccountSelector({
  accounts,
  value,
  onValueChange,
  placeholder,
  showIcon = true,
  className,
}: AccountSelectorProps) {
  const t = useTranslations("expenses");

  return (
    <Select value={value || ""} onValueChange={onValueChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder ?? t("selectAccount")} />
      </SelectTrigger>
      <SelectContent>
        {accounts.map((account) => (
          <SelectItem key={account.id} value={account.id}>
            {showIcon ? (
              <div className="flex items-center gap-2">
                <IconBadge
                  icon={account.icon ?? "wallet"}
                  color={account.color ?? "#6366f1"}
                  size="xs"
                />
                {account.name}
              </div>
            ) : (
              account.name
            )}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
