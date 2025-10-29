import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { AuthRequestError, signIn as signInMutation } from "./api";
import { parseLocaleFromCookieHeader } from "@/src/lib/locale/utils";

export const authOptions: NextAuthOptions = {
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
  },
};
