"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Wrench,
  Database,
  Mail,
  ExternalLink,
  Languages,
  Check,
  LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocaleStore } from "@/store/locale-store";
import { localeNames } from "@/i18n/config";

interface DevLink {
  nameKey: "supabaseStudio" | "inbucket";
  descriptionKey: "databaseManagement" | "viewSentEmails";
  url: string;
  icon: LucideIcon;
}

const devLinks: DevLink[] = [
  {
    nameKey: "supabaseStudio",
    url: "http://localhost:54323",
    icon: Database,
    descriptionKey: "databaseManagement",
  },
  {
    nameKey: "inbucket",
    url: "http://localhost:54324",
    icon: Mail,
    descriptionKey: "viewSentEmails",
  },
];

export function DevTools() {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations("devTools");
  const { locale, setLocale } = useLocaleStore();

  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  const isKannada = locale === "kn";

  const handleToggleKannada = () => {
    // Toggle between Kannada and English
    setLocale(isKannada ? "en" : "kn");
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-dashed border-yellow-500 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950"
        >
          <Wrench className="h-4 w-4" />
          {t("title")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{t("localDevelopment")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {devLinks.map((link) => (
          <DropdownMenuItem key={link.nameKey} asChild>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <link.icon className="h-4 w-4" />
                <div>
                  <div className="font-medium">{t(link.nameKey)}</div>
                  <div className="text-xs text-muted-foreground">
                    {t(link.descriptionKey)}
                  </div>
                </div>
              </div>
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
            </a>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel>{t("i18nTesting")}</DropdownMenuLabel>
        <DropdownMenuItem onClick={handleToggleKannada}>
          <div className="flex items-center gap-2">
            <Languages className="h-4 w-4" />
            <div>
              <div className="font-medium">{localeNames.kn}</div>
              <div className="text-xs text-muted-foreground">
                {t("kannadaDescription")}
              </div>
            </div>
          </div>
          {isKannada && <Check className="h-4 w-4 ml-auto" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
