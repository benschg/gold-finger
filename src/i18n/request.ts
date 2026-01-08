import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { defaultLocale, isValidLocale, LOCALE_COOKIE_NAME } from "./config";

export default getRequestConfig(async () => {
  // Read locale from cookie (set by middleware)
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE_NAME)?.value;

  // Validate and use the locale, falling back to default
  const locale =
    cookieLocale && isValidLocale(cookieLocale) ? cookieLocale : defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
