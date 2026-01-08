"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";

export function MarketingFooter() {
  const t = useTranslations("landing");
  const tCommon = useTranslations("common");

  return (
    <footer className="border-t py-12">
      <div className="container">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/gold-finger.svg"
              alt={tCommon("appName")}
              width={20}
              height={20}
            />
            <span className="font-semibold">{tCommon("appName")}</span>
          </Link>

          <p className="text-sm text-muted-foreground">
            {t("heroTitle")} {t("heroHighlight")}.
          </p>
        </div>
      </div>
    </footer>
  );
}
