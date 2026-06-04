import type { NextAuthConfig } from "next-auth";
import type { Role } from "@/lib/auth/roles";

/**
 * Edge-safe NextAuth config used by middleware.
 *
 * CRITICAL: This file MUST NOT import anything that transitively loads
 * Mongoose (e.g. `lib/db/mongoose`, `lib/models/*`, `lib/auth/auth.ts`).
 * Middleware runs on the Edge Runtime where Mongoose is not allowed.
 *
 * Keep this config minimal: only the session/JWT callbacks needed to
 * read the token in middleware. Real auth (Credentials provider, DB
 * lookups) lives in `lib/auth/auth.ts` and is only used in Node runtime.
 */
export const authEdgeConfig: NextAuthConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as { id?: string }).id;
        token.role = (user as { role?: Role }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = (token.id as string) ?? "";
        session.user.role = (token.role as Role) ?? "member";
      }
      return session;
    },
  },
};
