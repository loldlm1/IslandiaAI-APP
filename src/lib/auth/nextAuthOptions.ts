import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { AuthRequestError, fetchViewer, login } from "./api";

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
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new AuthRequestError("Email and password are required");
        }

        try {
          const result = await login({
            email: credentials.email,
            password: credentials.password,
          });

          const viewer = await fetchViewer(result.tokens.accessToken);

          return {
            id: viewer.id,
            name: viewer.name,
            email: viewer.email,
            accessToken: result.tokens.accessToken,
            refreshToken: result.tokens.refreshToken ?? undefined,
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
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.user = {
          id: user.id,
          name: user.name ?? undefined,
          email: user.email ?? undefined,
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

      if (typeof token.accessToken === "string") {
        session.accessToken = token.accessToken;
      }

      if (typeof token.refreshToken === "string") {
        session.refreshToken = token.refreshToken;
      }

      return session;
    },
  },
};
