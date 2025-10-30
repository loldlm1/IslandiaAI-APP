import { cookies, headers } from "next/headers";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import {
  AuthRequestError,
  signIn as signInMutation,
  signOut as signOutMutation,
} from "./api";
import {
  SIGN_OUT_ERROR_COOKIE_NAME,
  SIGN_OUT_ERROR_MAX_AGE_SECONDS,
} from "./constants";
import { parseLocaleFromCookieHeader } from "@/src/lib/locale/utils";

const defaultPort = process.env.PORT ?? "43111";
const configuredHost = process.env.NEXT_PUBLIC_APP_HOST ?? "localhost";
const developmentUrl = (() => {
  if (/^https?:\/\//i.test(configuredHost)) {
    return configuredHost;
  }

  if (configuredHost.includes(":")) {
    return `http://${configuredHost}`;
  }

  return `http://${configuredHost}:${defaultPort}`;
})();

if (!process.env.NEXTAUTH_URL && process.env.NODE_ENV !== "production") {
  process.env.NEXTAUTH_URL = developmentUrl;
}

interface ParsedCookiePayload {
  sameSite?: "lax" | "strict" | "none";
  name: string;
  value: string;
  path?: string;
  domain?: string;
  secure?: boolean;
  httpOnly?: boolean;
  expires?: Date;
  maxAge?: number;
}

function parseSetCookieHeader(setCookie: string): ParsedCookiePayload | null {
  const segments = setCookie.split(";").map((segment) => segment.trim());
  if (segments.length === 0) {
    return null;
  }

  const [nameValue, ...attributeSegments] = segments;
  const [rawName, ...rawValueParts] = nameValue.split("=");
  if (!rawName || rawValueParts.length === 0) {
    return null;
  }

  const name = rawName.trim();
  const value = rawValueParts.join("=");

  const attributes = new Map<string, string | true>();
  for (const segment of attributeSegments) {
    if (!segment) {
      continue;
    }

    const [attributeName, ...attributeValueParts] = segment.split("=");
    if (!attributeName) {
      continue;
    }

    const key = attributeName.trim().toLowerCase();
    const attributeValue = attributeValueParts.join("=").trim();
    if (!attributeValue) {
      attributes.set(key, true);
    } else {
      attributes.set(key, attributeValue);
    }
  }

  const sameSiteValue = attributes.get("samesite");
  const normalizedSameSite =
    typeof sameSiteValue === "string" ? sameSiteValue.toLowerCase() : undefined;
  const sameSite =
    normalizedSameSite === "lax" || normalizedSameSite === "strict" || normalizedSameSite === "none"
      ? normalizedSameSite
      : undefined;

  const expiresValue = attributes.get("expires");
  const expires =
    typeof expiresValue === "string" && expiresValue
      ? new Date(expiresValue)
      : undefined;

  const maxAgeValue = attributes.get("max-age");
  const maxAge =
    typeof maxAgeValue === "string"
      ? Number.parseInt(maxAgeValue, 10)
      : undefined;

  return {
    name,
    value,
    path: typeof attributes.get("path") === "string" ? (attributes.get("path") as string) : undefined,
    domain:
      typeof attributes.get("domain") === "string" ? (attributes.get("domain") as string) : undefined,
    secure: attributes.has("secure") || attributes.get("secure") === true,
    httpOnly: attributes.has("httponly") || attributes.get("httponly") === true,
    sameSite,
    expires: Number.isFinite(expires?.valueOf() ?? NaN) ? expires : undefined,
    maxAge: Number.isFinite(maxAge ?? NaN) ? maxAge : undefined,
  };
}

async function applyGraphqlCookies(setCookies: string[]): Promise<void> {
  if (!setCookies.length) {
    return;
  }

  const cookieStore = await cookies();
  const requestHeaders = await headers();
  const forwardedHost =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? undefined;
  const normalizedHost = forwardedHost
    ?.split(",")[0]
    ?.trim()
    .replace(/:\d+$/, "")
    .toLowerCase();

  for (const setCookie of setCookies) {
    const parsed = parseSetCookieHeader(setCookie);
    if (!parsed) {
      continue;
    }

    let cookieDomain = parsed.domain;
    if (cookieDomain && normalizedHost) {
      const normalizedDomain = cookieDomain.replace(/^\./, "").toLowerCase();
      const hostMatchesDomain =
        normalizedHost === normalizedDomain || normalizedHost.endsWith(`.${normalizedDomain}`);

      if (!hostMatchesDomain) {
        cookieDomain = undefined;
      }
    }

    cookieStore.set({
      name: parsed.name,
      value: parsed.value,
      path: parsed.path,
      domain: cookieDomain,
      secure: Boolean(parsed.secure),
      httpOnly: Boolean(parsed.httpOnly),
      sameSite: parsed.sameSite,
      expires: parsed.expires,
      maxAge: parsed.maxAge,
    });
  }
}

async function clearSignOutErrorCookie(): Promise<void> {
  const cookieStore = await cookies();
  if (typeof cookieStore.delete === "function") {
    cookieStore.delete(SIGN_OUT_ERROR_COOKIE_NAME);
  }

  cookieStore.set({
    name: SIGN_OUT_ERROR_COOKIE_NAME,
    value: "",
    path: "/",
    maxAge: 0,
  });
}

async function setSignOutErrorCookie(message: string): Promise<void> {
  const cookieStore = await cookies();
  const serializedValue = encodeURIComponent(message);

  cookieStore.set({
    name: SIGN_OUT_ERROR_COOKIE_NAME,
    value: serializedValue,
    path: "/",
    maxAge: SIGN_OUT_ERROR_MAX_AGE_SECONDS,
    sameSite: "lax",
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
  });
}

export const authOptions: NextAuthOptions = {
  trustHost: true,
  useSecureCookies: process.env.NODE_ENV === "production",
  secret:
    process.env.NEXTAUTH_SECRET ??
    (process.env.NODE_ENV === "production" ? undefined : "development-nextauth-secret"),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/signin",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new AuthRequestError("Email and password are required");
        }

        try {
          const locale = parseLocaleFromCookieHeader(req?.headers?.cookie);
          const result = await signInMutation({
            email: credentials.email,
            password: credentials.password,
          }, { locale });

          if (result.userErrors.length > 0) {
            throw new AuthRequestError(result.userErrors[0]?.message ?? "Unable to sign in", {
              details: result.userErrors,
            });
          }

          const viewer = result.user;

          if (!viewer) {
            throw new AuthRequestError("Authentication response did not include a user");
          }

          await applyGraphqlCookies(result.setCookies);

          return {
            id: viewer.id,
            name: viewer.name,
            email: viewer.email,
          };
        } catch (error) {
          if (error instanceof AuthRequestError) {
            throw error;
          }

          throw new AuthRequestError("Unable to complete sign in", {
            cause: error,
          });
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.user = {
          id: user.id,
          name: user.name ?? undefined,
          email: user.email ?? undefined,
        };
      } else if (trigger === "update" && session?.user) {
        token.user = {
          ...token.user,
          id: session.user.id ?? token.user?.id,
          name: session.user.name ?? token.user?.name,
          email: session.user.email ?? token.user?.email,
        };
      }

      return token;
    },
    async session({ session, token }) {
      if (token.user) {
        session.user = {
          ...session.user,
          ...token.user,
        };
      }

      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      if (new URL(url).origin === baseUrl) {
        return url;
      }
      return baseUrl;
    },
  },
  events: {
    async signOut() {
      try {
        const headerStore = await headers();
        const cookieHeader = headerStore.get("cookie");
        const locale = parseLocaleFromCookieHeader(cookieHeader);

        await clearSignOutErrorCookie();

        if (!cookieHeader?.includes("islandia_session")) {
          return;
        }

        const result = await signOutMutation({
          headers: cookieHeader ? { cookie: cookieHeader } : undefined,
          locale,
        });

        await applyGraphqlCookies(result.setCookies);

        if (result.userErrors.length > 0) {
          console.warn("GraphQL sign-out returned user errors", result.userErrors);
          const message = result.userErrors
            .map((error) => error.message)
            .filter((value): value is string => Boolean(value?.trim()))
            .join(" ")
            .trim();

          await setSignOutErrorCookie(
            message || "We couldn't complete your sign out. Please try again.",
          );
        }
      } catch (error) {
        console.error("Failed to clear authentication cookies", error);

        const message =
          error instanceof Error && error.message
            ? error.message
            : "We couldn't complete your sign out. Please try again.";

        await setSignOutErrorCookie(message);
      }
    },
  },
};
