import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

export const metadata = {
  title: "Terms of Service | Gold-Finger",
  description: "Terms of Service for Gold-Finger expense tracking app",
};

export default async function TermsPage() {
  const t = await getTranslations("legal");
  const tCommon = await getTranslations("common");

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <header className="flex justify-between items-center p-4 max-w-4xl mx-auto">
        <Link
          href="/"
          className="text-xl font-bold hover:text-yellow-500 transition-colors"
        >
          {tCommon("appName")}
        </Link>
        <LanguageSwitcher />
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <article className="prose prose-slate dark:prose-invert max-w-none">
          <h1>{t("termsTitle")}</h1>
          <p className="text-muted-foreground">
            {t("lastUpdated")}: {t("termsLastUpdated")}
          </p>

          <section>
            <h2>{t("termsIntroTitle")}</h2>
            <p>{t("termsIntroText")}</p>
          </section>

          <section>
            <h2>{t("serviceDescTitle")}</h2>
            <p>{t("serviceDescText")}</p>
          </section>

          <section>
            <h2>{t("accountTitle")}</h2>
            <p>{t("accountText")}</p>
            <ul>
              <li>{t("accountEmailAccurate")}</li>
              <li>{t("accountSecure")}</li>
              <li>{t("accountResponsible")}</li>
            </ul>
          </section>

          <section>
            <h2>{t("acceptableUseTitle")}</h2>
            <p>{t("acceptableUseText")}</p>
            <ul>
              <li>{t("useNoIllegal")}</li>
              <li>{t("useNoHarm")}</li>
              <li>{t("useNoAbuse")}</li>
              <li>{t("useNoReverse")}</li>
            </ul>
          </section>

          <section>
            <h2>{t("financialDisclaimerTitle")}</h2>
            <p>{t("financialDisclaimerText")}</p>
          </section>

          <section>
            <h2>{t("intellectualPropertyTitle")}</h2>
            <p>{t("intellectualPropertyText")}</p>
          </section>

          <section>
            <h2>{t("userContentTitle")}</h2>
            <p>{t("userContentText")}</p>
          </section>

          <section>
            <h2>{t("limitationTitle")}</h2>
            <p>{t("limitationText")}</p>
          </section>

          <section>
            <h2>{t("serviceAvailabilityTitle")}</h2>
            <p>{t("serviceAvailabilityText")}</p>
          </section>

          <section>
            <h2>{t("terminationTitle")}</h2>
            <p>{t("terminationText")}</p>
          </section>

          <section>
            <h2>{t("changesTitle")}</h2>
            <p>{t("changesText")}</p>
          </section>

          <section>
            <h2>{t("governingLawTitle")}</h2>
            <p>{t("governingLawText")}</p>
          </section>

          <section>
            <h2>{t("contactTitle")}</h2>
            <p>{t("termsContactText")}</p>
          </section>
        </article>

        <div className="mt-8 pt-8 border-t text-center">
          <Link href="/privacy" className="text-primary hover:underline">
            {t("viewPrivacy")}
          </Link>
          {" | "}
          <Link href="/auth/login" className="text-primary hover:underline">
            {t("backToLogin")}
          </Link>
        </div>
      </main>
    </div>
  );
}
