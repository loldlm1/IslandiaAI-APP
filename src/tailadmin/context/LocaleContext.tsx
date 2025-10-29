"use client";

import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_MAX_AGE_SECONDS,
  LOCALE_COOKIE_NAME,
  LOCALE_STORAGE_KEY,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from "@/src/lib/locale/constants";
import { normalizeLocale } from "@/src/lib/locale/utils";
import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

interface LocaleContextValue {
  locale: SupportedLocale;
  setLocale: (nextLocale: SupportedLocale) => void;
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

interface LocaleProviderProps {
  children: ReactNode;
  initialLocale?: string | null;
}

function getBrowserPreferredLocale(): SupportedLocale {
  if (typeof window === "undefined") {
    return DEFAULT_LOCALE;
  }

  const navigatorLocale = window.navigator.language?.split("-")[0];
  return normalizeLocale(navigatorLocale);
}

function readStoredLocale(): SupportedLocale | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (!stored) {
      return null;
    }

    return normalizeLocale(stored);
  } catch (error) {
    console.warn("Unable to read stored locale", error);
    return null;
  }
}

function persistLocale(locale: SupportedLocale) {
  if (typeof document !== "undefined") {
    document.documentElement.lang = locale;

    const expires = new Date(Date.now() + LOCALE_COOKIE_MAX_AGE_SECONDS * 1000).toUTCString();
    document.cookie = `${LOCALE_COOKIE_NAME}=${encodeURIComponent(locale)}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE_SECONDS}; expires=${expires}`;
  }

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch (error) {
      console.warn("Unable to persist locale", error);
    }
  }
}

export function LocaleProvider({ children, initialLocale }: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<SupportedLocale>(() => {
    if (initialLocale) {
      return normalizeLocale(initialLocale);
    }

    if (typeof window !== "undefined") {
      const stored = readStoredLocale();
      if (stored) {
        return stored;
      }

      return getBrowserPreferredLocale();
    }

    return DEFAULT_LOCALE;
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const stored = readStoredLocale();
    if (stored && stored !== locale) {
      setLocaleState(stored);
      return;
    }

    if (!stored && !initialLocale) {
      const browserPreferred = getBrowserPreferredLocale();
      if (browserPreferred !== locale) {
        setLocaleState(browserPreferred);
      }
    }
    // We only want to run this effect once on mount when the component hydrates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    persistLocale(locale);
  }, [locale]);

  const setLocale = useCallback((nextLocale: SupportedLocale) => {
    setLocaleState(normalizeLocale(nextLocale));
  }, []);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
    }),
    [locale, setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);

  if (!context) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }

  return context;
}

export function useAvailableLocales() {
  return SUPPORTED_LOCALES;
}
