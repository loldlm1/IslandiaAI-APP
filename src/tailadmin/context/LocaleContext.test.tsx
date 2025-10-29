import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";

import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_NAME,
  LOCALE_STORAGE_KEY,
  type SupportedLocale,
} from "@/src/lib/locale/constants";
import { LocaleProvider, useLocale } from "./LocaleContext";

function withProvider(
  children: ReactNode,
  props: Partial<{ initialLocale: string | null }> = {},
) {
  return (
    <LocaleProvider initialLocale={props.initialLocale}>{children}</LocaleProvider>
  );
}

describe("LocaleContext", () => {
  beforeEach(() => {
    document.cookie = `${LOCALE_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
    window.localStorage.clear();
    document.documentElement.lang = DEFAULT_LOCALE;
  });

  it("uses the provided initial locale", () => {
    const wrapper = ({ children }: { children: ReactNode }) =>
      withProvider(children, { initialLocale: "es" });

    const { result } = renderHook(() => useLocale(), { wrapper });

    expect(result.current.locale).toBe("es");
  });

  it("falls back to the default locale when the initial locale is unsupported", () => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, "fr");

    const wrapper = ({ children }: { children: ReactNode }) => withProvider(children);

    const { result } = renderHook(() => useLocale(), { wrapper });

    expect(result.current.locale).toBe(DEFAULT_LOCALE);
  });

  it("persists locale changes to the document, storage, and cookies", () => {
    const wrapper = ({ children }: { children: ReactNode }) => withProvider(children);

    const { result } = renderHook(() => useLocale(), { wrapper });

    act(() => {
      result.current.setLocale("es" as SupportedLocale);
    });

    expect(result.current.locale).toBe("es");
    expect(document.documentElement.lang).toBe("es");
    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("es");
    expect(document.cookie).toContain(`${LOCALE_COOKIE_NAME}=es`);
  });
});
