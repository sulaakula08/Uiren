import "server-only";
import { cookies } from "next/headers";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  isLocale,
  translator,
  type Locale,
  type Translator,
} from "./i18n";
import { getSession } from "./session";

/** Локаль: cookie переключателя → профиль пользователя → русский. */
export async function getLocale(): Promise<Locale> {
  const fromCookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;

  const session = await getSession();
  if (isLocale(session?.locale)) return session.locale;

  return DEFAULT_LOCALE;
}

export async function getT(): Promise<{ t: Translator; locale: Locale }> {
  const locale = await getLocale();
  return { t: translator(locale), locale };
}
