"use client";

import type { ChangeEvent } from "react";

import { LOCALE_LABELS, type SupportedLocale } from "@/src/lib/locale/constants";
import { useAvailableLocales, useLocale } from "@tailadmin/context/LocaleContext";

export function LocaleSwitcher() {
  const { locale, setLocale } = useLocale();
  const availableLocales = useAvailableLocales();

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setLocale(event.target.value as SupportedLocale);
  };

  return (
    <label className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
      <span className="sr-only">Language</span>
      <select
        value={locale}
        onChange={handleChange}
        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-theme-xs transition hover:border-brand-300 focus:border-brand-500 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        aria-label="Language"
      >
        {availableLocales.map((code) => (
          <option key={code} value={code}>
            {LOCALE_LABELS[code]}
          </option>
        ))}
      </select>
    </label>
  );
}
