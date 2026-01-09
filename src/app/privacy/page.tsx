import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

export const metadata = {
  title: "Privacy Policy | Gold-Finger",
  description: "Privacy Policy for Gold-Finger expense tracking app",
};

export default async function PrivacyPage() {
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
          <h1>{t("privacyTitle")}</h1>
          <p className="text-muted-foreground">
            {t("lastUpdated")}: {t("privacyLastUpdated")}
          </p>

          <section>
            <h2>{t("privacyIntroTitle")}</h2>
            <p>{t("privacyIntroText")}</p>
          </section>

          <section>
            <h2>{t("dataControllerTitle")}</h2>
            <p>{t("dataControllerText")}</p>
          </section>

          <section>
            <h2>{t("dataCollectedTitle")}</h2>
            <p>{t("dataCollectedIntro")}</p>
            <ul>
              <li>
                <strong>{t("dataEmail")}</strong> - {t("dataEmailDesc")}
              </li>
              <li>
                <strong>{t("dataFinancial")}</strong> - {t("dataFinancialDesc")}
              </li>
              <li>
                <strong>{t("dataReceipts")}</strong> - {t("dataReceiptsDesc")}
              </li>
              <li>
                <strong>{t("dataPreferences")}</strong> -{" "}
                {t("dataPreferencesDesc")}
              </li>
            </ul>
          </section>

          <section>
            <h2>{t("legalBasisTitle")}</h2>
            <p>{t("legalBasisText")}</p>
            <ul>
              <li>
                <strong>{t("basisConsent")}</strong> - {t("basisConsentDesc")}
              </li>
              <li>
                <strong>{t("basisContract")}</strong> - {t("basisContractDesc")}
              </li>
              <li>
                <strong>{t("basisLegitimate")}</strong> -{" "}
                {t("basisLegitimateDesc")}
              </li>
            </ul>
          </section>

          <section>
            <h2>{t("thirdPartyTitle")}</h2>
            <p>{t("thirdPartyIntro")}</p>
            <ul>
              <li>
                <strong>Supabase</strong> - {t("thirdPartySupabase")}
              </li>
              <li>
                <strong>Google Gemini AI</strong> - {t("thirdPartyGemini")}
              </li>
            </ul>
          </section>

          <section>
            <h2>{t("dataRetentionTitle")}</h2>
            <p>{t("dataRetentionText")}</p>
          </section>

          <section>
            <h2>{t("yourRightsTitle")}</h2>
            <p>{t("yourRightsIntro")}</p>
            <ul>
              <li>
                <strong>{t("rightAccess")}</strong> - {t("rightAccessDesc")}
              </li>
              <li>
                <strong>{t("rightRectification")}</strong> -{" "}
                {t("rightRectificationDesc")}
              </li>
              <li>
                <strong>{t("rightErasure")}</strong> - {t("rightErasureDesc")}
              </li>
              <li>
                <strong>{t("rightPortability")}</strong> -{" "}
                {t("rightPortabilityDesc")}
              </li>
              <li>
                <strong>{t("rightObjection")}</strong> -{" "}
                {t("rightObjectionDesc")}
              </li>
            </ul>
          </section>

          <section>
            <h2>{t("securityTitle")}</h2>
            <p>{t("securityText")}</p>
          </section>

          <section>
            <h2>{t("cookiesTitle")}</h2>
            <p>{t("cookiesText")}</p>
          </section>

          <section>
            <h2>{t("contactTitle")}</h2>
            <p>{t("contactText")}</p>
          </section>
        </article>

        <div className="mt-8 pt-8 border-t text-center">
          <Link href="/terms" className="text-primary hover:underline">
            {t("viewTerms")}
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
