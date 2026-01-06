"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

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
import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  ACCOUNT_COLORS,
  DEFAULT_ACCOUNT_COLOR,
} from "@/lib/constants";
import type { Currency } from "@/types/database";

interface CreateAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateAccountDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateAccountDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("wallet");
  const [color, setColor] = useState<string>(DEFAULT_ACCOUNT_COLOR);
  const [currency, setCurrency] = useState<Currency>(DEFAULT_CURRENCY);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          color,
          icon,
          currency,
        }),
      });

      if (response.ok) {
        setName("");
        setIcon("wallet");
        setColor(DEFAULT_ACCOUNT_COLOR);
        setCurrency(DEFAULT_CURRENCY);
        onOpenChange(false);
        onSuccess?.();
      }
    } catch (error) {
      console.error("Error creating account:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Account</DialogTitle>
        </DialogHeader>

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

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !name.trim()}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Account
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
