// Root middleware — delegates to the auth-aware middleware in lib/auth/middleware.ts.
// Next.js 15 only auto-loads middleware.ts at the project root, so this is required.
export { default, config } from "@/lib/auth/middleware";
