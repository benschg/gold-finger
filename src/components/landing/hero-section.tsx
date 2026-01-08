"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ArrowRight, Receipt, PieChart, Users } from "lucide-react";
import { HeroFingerAnimation } from "./hero-finger-animation";

export function HeroSection() {
  const t = useTranslations("landing");

  return (
    <section className="container py-24 md:py-32">
      <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <HeroFingerAnimation />

        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          {t("heroTitle")}{" "}
          <span className="text-yellow-500">{t("heroHighlight")}</span>
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          {t("heroDescription")}
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Button size="lg" asChild>
            <Link href="/login">
              {t("startTracking")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-3">
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/10">
              <Receipt className="h-6 w-6 text-yellow-500" />
            </div>
            <h3 className="font-semibold">{t("aiReceiptScanning")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("aiReceiptDescription")}
            </p>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/10">
              <PieChart className="h-6 w-6 text-yellow-500" />
            </div>
            <h3 className="font-semibold">{t("visualAnalytics")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("visualAnalyticsDescription")}
            </p>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/10">
              <Users className="h-6 w-6 text-yellow-500" />
            </div>
            <h3 className="font-semibold">{t("sharedAccounts")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("sharedAccountsDescription")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
