"use client";

import { useState, useEffect } from "react";
import { Loader2, Palette } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IconPicker, IconBadge, ColorPicker } from "@/components/ui/icon-picker";
import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  ACCOUNT_COLORS,
  DEFAULT_ACCOUNT_COLOR,
} from "@/lib/constants";
import type { AccountWithRole, Currency } from "@/types/database";

interface AccountDetailsSectionProps {
  account: AccountWithRole;
  onSuccess?: () => void;
}

export function AccountDetailsSection({
  account,
  onSuccess,
}: AccountDetailsSectionProps) {
  const [name, setName] = useState(account.name);
  const [currency, setCurrency] = useState<Currency>(
    (account.currency as Currency) || DEFAULT_CURRENCY
  );
  const [icon, setIcon] = useState(account.icon || "wallet");
  const [color, setColor] = useState(account.color || DEFAULT_ACCOUNT_COLOR);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isIconColorDialogOpen, setIsIconColorDialogOpen] = useState(false);

  const isOwner = account.role === "owner";

  // Reset form when account changes
  useEffect(() => {
    setName(account.name);
    setCurrency((account.currency as Currency) || DEFAULT_CURRENCY);
    setIcon(account.icon || "wallet");
    setColor(account.color || DEFAULT_ACCOUNT_COLOR);
  }, [account]);

  const handleSave = async () => {
    if (!name.trim()) return;

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
        onSuccess?.();
      }
    } catch (error) {
      console.error("Error updating account:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleIconColorSave = () => {
    setIsIconColorDialogOpen(false);
    handleSave();
  };

  if (!isOwner) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <IconBadge icon={icon} color={color} size="lg" />
          <div>
            <p className="font-medium">{account.name}</p>
            <p className="text-sm text-muted-foreground">
              {CURRENCIES.find((c) => c.code === currency)?.label || currency}
            </p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Only the account owner can edit these settings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="account-name">Name</Label>
        <Input
          id="account-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Account name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="account-currency">Currency</Label>
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
        <Label>Icon & Color</Label>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start gap-3"
          onClick={() => setIsIconColorDialogOpen(true)}
        >
          <IconBadge icon={icon} color={color} size="sm" />
          <span>Change icon & color</span>
          <Palette className="ml-auto h-4 w-4 text-muted-foreground" />
        </Button>
      </div>

      <Button
        onClick={handleSave}
        disabled={isSubmitting || !name.trim()}
        className="w-fit"
      >
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Changes
      </Button>

      <Dialog open={isIconColorDialogOpen} onOpenChange={setIsIconColorDialogOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Icon & Color</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
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

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsIconColorDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleIconColorSave}>
                Apply
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
