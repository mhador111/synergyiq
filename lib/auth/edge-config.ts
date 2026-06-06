import type { NextAuthConfig } from "next-auth";
import type { Role } from "@/lib/auth/roles";

/**
 * Edge-runtime-safe NextAuth config. Kept free of Mongoose / Node-only
 * imports so the middleware bundle stays under the edge size limit.
 */
export const authEdgeConfig: NextAuthConfig = {
  trustHost: true,
  // Explicit secret reference — surfaces missing env at boot with a
  // clear error instead of the generic `MissingSecret` at request time.
  secret: process.env.AUTH_SECRET,
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
