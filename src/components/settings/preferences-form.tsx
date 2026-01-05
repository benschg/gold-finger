"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import type { Currency } from "@/types/database";

const currencies: { value: Currency; label: string }[] = [
  { value: "EUR", label: "Euro (€)" },
  { value: "USD", label: "US Dollar ($)" },
  { value: "GBP", label: "British Pound (£)" },
  { value: "CHF", label: "Swiss Franc (CHF)" },
  { value: "JPY", label: "Japanese Yen (¥)" },
  { value: "CAD", label: "Canadian Dollar (C$)" },
  { value: "AUD", label: "Australian Dollar (A$)" },
];

interface PreferencesFormProps {
  profile?: {
    preferred_currency?: Currency;
    theme?: "light" | "dark" | "system";
  };
}

export function PreferencesForm({ profile }: PreferencesFormProps) {
  const router = useRouter();
  const { theme: currentTheme, setTheme } = useTheme();
  const [currency, setCurrency] = useState<Currency>(
    profile?.preferred_currency || "EUR"
  );
  const [selectedTheme, setSelectedTheme] = useState(
    profile?.theme || currentTheme || "system"
  );
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleThemeChange = (value: string) => {
    setSelectedTheme(value);
    setTheme(value);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update({
          preferred_currency: currency,
          theme: selectedTheme as "light" | "dark" | "system",
        })
        .eq("id", user.id);

      if (error) throw error;

      setMessage({ type: "success", text: "Preferences saved!" });
      router.refresh();
    } catch (error) {
      console.error("Save error:", error);
      setMessage({ type: "error", text: "Failed to save preferences" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid gap-4 max-w-md">
      <div className="space-y-2">
        <Label htmlFor="currency">Default Currency</Label>
        <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
          <SelectTrigger>
            <SelectValue placeholder="Select currency" />
          </SelectTrigger>
          <SelectContent>
            {currencies.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="theme">Theme</Label>
        <Select value={selectedTheme} onValueChange={handleThemeChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select theme" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="light">Light</SelectItem>
            <SelectItem value="dark">Dark</SelectItem>
            <SelectItem value="system">System</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button onClick={handleSave} disabled={isSaving} className="w-fit">
        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Preferences
      </Button>

      {message && (
        <p
          className={`text-sm ${
            message.type === "success" ? "text-green-600" : "text-destructive"
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
