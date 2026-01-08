"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { DevTools } from "@/components/layout/dev-tools";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

export function MarketingHeader() {
  const t = useTranslations("landing");
  const tCommon = useTranslations("common");

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/gold-finger.svg"
            alt={tCommon("appName")}
            width={24}
            height={24}
          />
          <span className="hidden whitespace-nowrap text-xl font-bold sm:inline">
            {tCommon("appName")}
          </span>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-4">
          <LanguageSwitcher />
          <DevTools />
          <Button variant="ghost" asChild>
            <Link href="/login">{t("login")}</Link>
          </Button>
          <Button asChild>
            <Link href="/login">{t("getStarted")}</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
