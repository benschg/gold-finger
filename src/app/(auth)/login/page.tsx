import { getTranslations } from "next-intl/server";
import { OTPForm } from "@/components/auth/otp-form";
import { HeroFingerAnimation } from "@/components/landing/hero-finger-animation";
import Link from "next/link";

export const metadata = {
  title: "Sign In | Gold-Finger",
  description: "Sign in to your Gold-Finger account",
};

export default async function LoginPage() {
  const t = await getTranslations("auth");
  const tCommon = await getTranslations("common");

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Link href="/">
          <h1 className="text-3xl font-bold tracking-tight hover:text-yellow-500 transition-colors">
            {tCommon("appName")}
          </h1>
        </Link>
        <p className="text-muted-foreground mt-2">{t("trackExpenses")}</p>
      </div>

      <OTPForm />

      <p className="text-center text-sm text-muted-foreground">
        {t("termsAgreement")}{" "}
        <Link href="/terms" className="underline hover:text-primary">
          {t("termsOfService")}
        </Link>{" "}
        {t("and")}{" "}
        <Link href="/privacy" className="underline hover:text-primary">
          {t("privacyPolicy")}
        </Link>
      </p>

      <div className="mt-16">
        <HeroFingerAnimation />
      </div>
    </div>
  );
}
