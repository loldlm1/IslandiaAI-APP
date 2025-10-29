import { DEFAULT_LOCALE, LOCALE_COOKIE_NAME, SUPPORTED_LOCALES, type SupportedLocale } from "./constants";

export function isSupportedLocale(candidate: string | null | undefined): candidate is SupportedLocale {
  if (!candidate) {
    return false;
  }

  return (SUPPORTED_LOCALES as readonly string[]).includes(candidate);
}

export function normalizeLocale(candidate: string | null | undefined): SupportedLocale {
  return isSupportedLocale(candidate) ? candidate : DEFAULT_LOCALE;
}

export function parseLocaleFromCookieHeader(cookieHeader: string | null | undefined): SupportedLocale {
  if (!cookieHeader) {
    return DEFAULT_LOCALE;
  }

  const cookies = cookieHeader.split(";").map((part) => part.trim());
  for (const cookie of cookies) {
    if (!cookie) {
      continue;
    }

    const [name, ...rest] = cookie.split("=");
    if (name !== LOCALE_COOKIE_NAME) {
      continue;
    }

    const value = rest.join("=");
    if (!value) {
      break;
    }

    const decoded = decodeURIComponent(value);
    const normalized = normalizeLocale(decoded);

    if (normalized) {
      return normalized;
    }
  }

  return DEFAULT_LOCALE;
}
