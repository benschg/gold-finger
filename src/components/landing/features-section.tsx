"use client";

import { useTranslations } from "next-intl";
import { Wallet, Tag, Globe, Moon, Shield, Smartphone } from "lucide-react";

const featureKeys = [
  { key: "multipleAccounts", icon: Wallet },
  { key: "categoriesTags", icon: Tag },
  { key: "multiCurrency", icon: Globe },
  { key: "darkMode", icon: Moon },
  { key: "securePrivate", icon: Shield },
  { key: "mobileFriendly", icon: Smartphone },
] as const;

export function FeaturesSection() {
  const t = useTranslations("landing");

  return (
    <section className="border-t bg-muted/50 py-24">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            {t("featuresTitle")}
          </h2>
          <p className="mt-4 text-muted-foreground">{t("featuresSubtitle")}</p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {featureKeys.map(({ key, icon: Icon }) => (
            <div
              key={key}
              className="gold-shimmer-card rounded-lg border bg-background p-6 transition-shadow hover:shadow-lg"
            >
              <Icon className="h-8 w-8 text-yellow-500" />
              <h3 className="mt-4 font-semibold">{t(key)}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {t(`${key}Description`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
