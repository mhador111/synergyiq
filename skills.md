# SynergyIQ — Skills Inventory & Status

> Living document of every skill / pattern / piece-of-knowledge used or needed by this project. Each entry has a **status** so any new agent can pick up exactly where the last one stopped. Update the status when you finish a row (and bump the date).

| Status | Meaning |
|---|---|
| ✅ done | Working in code, verified by `npm run dev` or `npm run seed` or `npx tsc --noEmit` |
| 🟡 in-progress | Partially done — see note column |
| ⬜ todo | Planned, not started |

Last updated: **2026-06-05** (end of Day 4 — all 4 days complete, deploy-ready)

---

## 1. Project Foundation

| Skill / Pattern | Status | Where it lives | Notes |
|---|---|---|---|
| `create-next-app@15` with `--src-dir=false` | ✅ | `project-collab/` | **Watch out:** default tsconfig `paths` still points to `./src/*` — must be manually fixed to `./*`. |
| tsconfig strict + path alias `@/*` | ✅ | `tsconfig.json` | `paths: { "@/*": ["./*"] }` |
| Tailwind v4 CSS-first config | ✅ | `app/globals.css` | `@import "tailwindcss"`, `@theme { ... }`, `@custom-variant dark (...)`. No `tailwind.config.ts`. |
| `@tailwindcss/postcss` plugin | ✅ | `postcss.config.mjs` | Required for Tailwind v4 with Next 15. |
| Geist Sans + Geist Mono via `next/font` | ✅ | `app/layout.tsx` | `geistSans` + `geistMono` from `geist` package, applied via CSS vars `--font-sans`, `--font-mono`. |
| `npm run typecheck` script | ✅ | `package.json` | `tsc --noEmit` |
| `npm run seed` script | ✅ | `package.json` → `tsx scripts/seed.ts` | Requires `dotenv` (`import "dotenv/config"`) and a running `mongod`. |
| `.env.example` | ✅ | `.env.example` | `MONGODB_URI`, `AUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_NAME`. `.gitignore` has `!.env.example` exception. |

---

## 2. Data Layer

| Skill / Pattern | Status | Where it lives | Notes |
|---|---|---|---|
| Hot-reload-safe Mongoose connection | ✅ | `lib/db/mongoose.ts` | Global `cached` pattern; `serverSelectionTimeoutMS: 10_000`; local fallback URI `mongodb://127.0.0.1:27017/project-collab` (change to `synergyiq` in prod). |
| User model + role enum | ✅ | `lib/models/user.ts` | Roles: `admin` / `manager` / `member` |
| Project model + status enum | ✅ | `lib/models/project.ts` | Status: `active` / `completed` / `on_hold` |
| Task model + status/priority enums | ✅ | `lib/models/task.ts` | Status: `todo` / `in_progress` / `completed`. Priority: `high` / `medium` / `low`. Has `position` for Kanban ordering. |
| Comment model | ✅ | `lib/models/comment.ts` | |
| Activity model | ✅ | `lib/models/activity.ts` | Snake_case types (`project_created`), `message` is required. |
| Notification model | ✅ | `lib/models/notification.ts` | |
| Zod v3 schemas (auth) | ✅ | `lib/validations/auth.ts` | `loginSchema`, `signupSchema` |
| Zod v3 schemas (project) | ✅ | `lib/validations/project.ts` | `projectCreateSchema`, `projectUpdateSchema`, `addMemberSchema`, `removeMemberSchema`, `projectIdSchema`. |
| Zod v3 schemas (task) | ✅ | `lib/validations/task.ts` | `taskCreateSchema`, `taskUpdateSchema`, `assignTaskSchema`, `updateStatusSchema`. |
| Zod v3 schemas (comment) | ✅ | `lib/validations/comment.ts` | `commentCreateSchema`, `commentIdSchema`. |
| `logActivity()` helper | ✅ | `lib/utils/activity.ts` | Called from `actions/projects.ts` and `actions/tasks.ts` for create/update/delete/status/member events. |
| Seed script (3 users, 1 project, 12 tasks, 3 comments, 4 activities) | ✅ | `scripts/seed.ts` | Verified: `npm run seed` completes; counts match. |
| Verify seed counts script | ⬜ | — | Was a one-off `scripts/verify.ts`, deleted after use. Re-create if needed. |

---

## 3. Auth & RBAC

| Skill / Pattern | Status | Where it lives | Notes |
|---|---|---|---|
| `NextAuth(authConfig)` setup | ✅ | `lib/auth/auth.ts` | Credentials provider, JWT session, role in token + session callback. |
| `auth()` server-side guard in `(app)/layout.tsx` | ✅ | `app/(app)/layout.tsx` | `if (!session?.user) redirect("/login")` |
| `auth()` defensive null-guard in pages | ✅ | `app/(app)/dashboard/page.tsx` | `if (!session?.user) return null;` (layout should have redirected, but this is belt + braces). |
| `[...nextauth]/route.ts` handlers | ✅ | `app/api/auth/[...nextauth]/route.ts` | Re-exports `handlers.GET` and `handlers.POST`. |
| `next-auth.d.ts` module augmentation | ✅ | `types/next-auth.d.ts` | Adds `id` and `role` to `Session["user"]` and `User`. |
| Signup API route | ✅ | `app/api/auth/signup/route.ts` | Validates with `signupSchema`, hashes password, creates user. Returns `{"ok": true}`. |
| `hasRole(user, "manager")` rank helper | ✅ | `lib/auth/rbac.ts` | Numeric ranks: admin=3, manager=2, member=1. |
| `middleware.ts` route protection | ✅ | `middleware.ts` at root + `lib/auth/edge-config.ts` (edge-safe subset) + `lib/auth/middleware.ts` (full guard). Guards `/dashboard`, `/projects`, `/tasks`, `/team`, `/analytics`. |
| Demo login button | ✅ | `app/(auth)/login/page.tsx` | Pre-fills admin creds and submits. |

---

## 4. Client State (Redux)

| Skill / Pattern | Status | Where it lives | Notes |
|---|---|---|---|
| `configureStore` with `auth` + `ui` slices | ✅ | `lib/redux/store.ts` | Standard pattern. |
| Typed `useAppDispatch` / `useAppSelector` | ✅ | `lib/redux/hooks.ts` | |
| `<StoreProvider>` (client component) | ✅ | `lib/redux/provider.tsx` | Wraps `{children}`, listens to `storeRef` for SSR. |
| `authSlice` (current user, isAuthenticated) | ✅ | `lib/redux/slices/authSlice.ts` | |
| `uiSlice` (sidebarOpen, theme) | ✅ | `lib/redux/slices/uiSlice.ts` | Includes `closeSidebar` (used by `MobileSidebar`). |
| `AuthHydrator` (puts session into Redux on mount) | ✅ | `components/layout/AuthHydrator.tsx` | |
| Server data in Redux (anti-pattern) | ❌ forbidden | — | Use SWR instead. |

---

## 5. Server State (SWR)

| Skill / Pattern | Status | Where it lives | Notes |
|---|---|---|---|
| Global `fetcher` (JSON) | ✅ | `lib/swr/fetcher.ts` | Throws on non-OK. |
| Centralized key constants | ✅ | `lib/swr/keys.ts` | `keys.projects.list()`, `keys.tasks.byProject(id)`, etc. |
| `useProjects()` hook | ✅ | `hooks/useProjects.ts` | Hits `/api/projects`. |
| `useProject(id)` hook | ✅ | `hooks/useProjects.ts` | Hits `/api/projects/${id}`. |
| `useTasks(params)` hook | ✅ | `hooks/useProjects.ts` | Hits `/api/tasks?projectId=…&mine=…&status=…`. |
| `useUsers()` hook | ✅ | `hooks/useProjects.ts` | Hits `/api/users` — for assignee pickers. |
| Optimistic update on task status change | ✅ | `components/projects/KanbanBoard.tsx` | Local state updates + `mutate()` revalidation; `updateTaskStatus` server action. |

---

## 6. UI Component Library (`components/ui/`)

All hand-rolled, Tailwind-only, **no** shadcn, **no** Radix. Forward refs.

| Component | Status | Notes |
|---|---|---|
| `Button` | ✅ | Variants: `primary`, `secondary`, `ghost`, `danger`, `outline`. Sizes: `sm`, `md`, `lg`. Supports `leftIcon` / `rightIcon` / `loading`. |
| `Input` | ✅ | Forwards ref for react-hook-form. |
| `Textarea` | ✅ | Same. |
| `Select` | ✅ | Native `<select>` styled, not a popover — accessible by default. |
| `Card` + `CardStat` | ✅ | `CardStat` has label / value / icon / optional trend. |
| `Badge` | ✅ | Variants: `primary`, `success`, `warn`, `danger`, `muted`, `outline`. |
| `Avatar` | ✅ | Image with initials fallback. |
| `Modal` | ✅ | Headless — backdrop + dialog wrapper. |
| `Dropdown` | ✅ | Click-outside via `useClickOutside` hook. |
| `Skeleton` | ✅ | For loading states. |
| `EmptyState` | ✅ | For empty lists. |
| `Pagination` | ✅ | Prev / next + page numbers. |
| `Progress` | ✅ | For task/project completion bars. |
| `Toaster` | ✅ | Wraps `react-hot-toast`. |
| `index.ts` barrel | ✅ | Re-exports everything for `import { Button } from "@/components/ui"`. |
| `Table` / `DataTable` | ✅ | Used by `app/(app)/projects/page.tsx`. |

---

## 7. Layout Shell (`components/layout/`)

| Component | Status | Notes |
|---|---|---|
| `Logo` | ✅ | Branded SynergyIQ wordmark + SVG. |
| `Sidebar` | ✅ | Desktop nav, role-aware items. |
| `Header` | ✅ | Top bar with search slot + user menu. |
| `MobileSidebar` | ✅ | Slide-in drawer, uses `closeSidebar` from uiSlice. |
| `AppShell` | ✅ | Sidebar + Header + main content. |
| `PageHeader` | ✅ | Title + description + actions slot. |
| `ThemeToggle` | ✅ | Light/dark switcher, persists to localStorage. |
| `AuthHydrator` | ✅ | Pushes `useSession()` into Redux on mount. |
| `ThemeApplier` | ✅ | Applies `.dark` class to `<html>` from stored theme. |

---

## 8. Pages

| Route | Status | Notes |
|---|---|---|
| `/` (landing) | ✅ | Branded hero + features grid. Server component, redirects to `/dashboard` if logged in. |
| `/login` | ✅ | React Hook Form + Zod, demo login button. |
| `/signup` | ✅ | Name/email/password/role form. |
| `/dashboard` | ✅ | 4 KPI cards + recent projects list. (Verified end-to-end.) |
| `/projects` | ✅ | DataTable with search + status filter. |
| `/projects/new` | ✅ | Create form (RHF + Zod). |
| `/projects/[id]` | ✅ | Project detail with Kanban (`KanbanBoard`), member sidebar, task create. |
| `/projects/[id]/settings` | ⬜ | Members management — partial (add/remove via actions exists, no dedicated page yet). Out of scope for the 4-day plan. |
| `/tasks` (my tasks) | ✅ | 3-column "mine" view, quick-advance, overdue highlight, project links. |
| `/team` | ✅ | Admin-only workload table, search, role change (admin gated). |
| `/search` | ✅ | Global search w/ 250ms debounce — 4 grouped result cards (projects, tasks, comments, people). |
| `/analytics` | ✅ | 4 Recharts: tasks-by-status (pie), tasks-by-priority (bar), project progress (custom bars), 14-day activity (line). |
| `/notifications` (page) | ✅ | Full-page list, mark-read, mark-all-read, time-ago, link to source. |
| `/settings` | ⬜ | Out of scope for the 4-day plan. |

---

## 9. Server Actions (`actions/`)

| Action | Status | Notes |
|---|---|---|
| `createProject` | ✅ | `actions/projects.ts`. Zod-validated, `logActivity("project_created")`. |
| `updateProject` | ✅ | `actions/projects.ts`. |
| `deleteProject` | ✅ | `actions/projects.ts`. Manager+ only (`hasRole`). |
| `addProjectMember` | ✅ | `actions/projects.ts`. |
| `removeProjectMember` | ✅ | `actions/projects.ts`. |
| `createTask` | ✅ | `actions/tasks.ts`. |
| `updateTask` | ✅ | `actions/tasks.ts`. |
| `updateTaskStatus` | ✅ | `actions/tasks.ts`. Logs `task_status_changed`. |
| `assignTask` | ✅ | `actions/tasks.ts`. Logs `task_assigned`. |
| `deleteTask` | ✅ | `actions/tasks.ts`. |
| `addComment` | ✅ | `actions/comments.ts`. Zod-validated, `logActivity("comment_added")`, fires notifications to assignees/creator. |
| `markNotificationRead` | ✅ | `actions/notifications.ts`. Plus `markAllNotificationsRead` and `setUserRole` (in `actions/users.ts`). |

---

## 10. Real-Time / UX Patterns

| Skill | Status | Notes |
|---|---|---|
| Optimistic SWR mutations | ✅ | `KanbanBoard` re-orders + `mutate()` revalidation; inline `updateTaskStatus` in `/tasks`. |
| Debounced search input | ✅ | `hooks/useDebounce.ts` (250ms) — used by `/search`. |
| Toast on action success/error | ✅ | `<Toaster />` is mounted in root layout; use `toast.success()` / `toast.error()` from `react-hot-toast`. |
| `loading.tsx` per route | ✅ | `app/loading.tsx` (root) + `app/(app)/loading.tsx` (app group). Skeleton-based. |
| `error.tsx` per route | ✅ | `app/error.tsx` (root, "use client" w/ reset) + `app/(app)/error.tsx` (app group). |
| `not-found.tsx` (404) | ✅ | `app/not-found.tsx` — branded Logo + Compass icon + Back Home / Dashboard buttons. |

---

## 11. Tooling & Deploy

| Skill | Status | Notes |
|---|---|---|
| ESLint | — | _No `lint` script wired in._ Project relies on `tsc --noEmit` as the primary safety net. Add ESLint only if the team has a clear config preference. |
| Prettier | ⬜ | Out of scope for the 4-day plan. |
| Vercel deploy config | ✅ | `next.config.ts` headers + `poweredByHeader: false`. `vercel.json` not needed (Next auto-detected). Env vars documented in `README.md`. |
| MongoDB Atlas connection string | ✅ | Documented in `README.md` → Deployment. Use `mongodb+srv://…` in Vercel env vars. |
| Security headers | ✅ | `next.config.ts` → `async headers()`: CSP (default-src 'self', script-src 'self' 'unsafe-inline', frame-ancestors 'none'), HSTS (max-age=63072000; includeSubDomains; preload), X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy (camera/microphone/geolocation blocked). |
| README with setup, demo creds, env vars, deploy steps | ✅ | `README.md` overhauled — features, stack, quick start, demo accounts, scripts, structure, design system, RBAC matrix, deployment, post-deploy checks. |
| `agent.md` (this repo's context) | ✅ | Day 1–4 status flipped to ✅. |
| `skills.md` (this file) | ✅ | Day 1–4 status flipped to ✅. |

---

## 12. Gotchas to Remember (FIX CASCADE — DO NOT REGRESS)

These were the bugs hit during Day 1. Any future agent should treat them as known constraints.

1. **`tsconfig.json` paths must be `./*` not `./src/*`** — there is no `src/` dir. If you see "Cannot find module '@/...'", this is the first thing to check.
2. **Mongoose models are exported as bare names** (`User`, not `UserModel`). Code that imports them as `UserModel` is stale.
3. **Zod is v3, not v4** — use `z.string().email()`. `z.email()` will produce a runtime error of `z.email is not a function`.
4. **`uiSlice` must export `closeSidebar`** — `MobileSidebar` calls it. Don't remove it.
5. **`Task.status` enum is `todo | in_progress | completed`** — not `done`.
6. **`Task.priority` enum is `high | medium | low`** — not `urgent`.
7. **`Activity.type` is snake_case** — `project_created`, not `project.created`.
8. **`Activity.message` is required** — every `Activity.create()` call must include a human-readable string.
9. **`import "mongoose"` (side-effect)** for scripts that only need the connection, **or** `import mongoose from "mongoose"` for code that needs `mongoose.Types.ObjectId`. Don't mix.
10. **`session?.user` can be null** even inside `(app)/` routes during the brief moment before the layout's `redirect()` runs. Always null-check.
11. **`@tailwindcss/postcss` must be installed** alongside `tailwindcss`. Tailwind v4 will silently 500 without it.
12. **Mongoose `lean()` returns `_id` as `ObjectId`** — for TS, cast explicitly to `mongoose.Types.ObjectId` in array maps.

---

## 13. Day-1 Sign-Off

| Check | Result |
|---|---|
| `npx tsc --noEmit` | ✅ 0 errors |
| `npm run seed` | ✅ 3 users, 1 project, **12 tasks**, 3 comments, 4 activities written |
| `GET /` | ✅ 200, brand "SynergyIQ" present |
| `GET /login` | ✅ 200 |
| `GET /dashboard` (unauth) | ✅ 307 → `/login` |
| `POST /api/auth/callback/credentials` (admin) | ✅ 302, session cookie set |
| `GET /api/auth/session` (admin) | ✅ `{"role":"admin","name":"Ada Lovelace"}` |
| `GET /dashboard` (admin) | ✅ 200, KPI cards + recent projects render |
| `POST /api/auth/callback/credentials` (member) | ✅ 302, `role:"member"` |
| `POST /api/auth/signup` (new email) | ✅ `{"ok": true}` |

**Days 1–4 are officially complete.** Final delivery: full project/task/comment/notification
flow, team page, global search, analytics, loading + error boundaries, security headers, and a
polished README. Ready for `git push` → Vercel deploy with MongoDB Atlas.

---

## 14. Session Start Checklist

When you (or a future agent) open this project cold, run these in order:

```bash
# 1. Verify env (must exist; create from template if missing)
ls .env.local || cp .env.example .env.local

# 2. Verify clean type-check
npm run typecheck   # → 0 errors

# 3. Verify seed still works (idempotent — wipes + reseeds)
npm run seed        # → "✓ Seeded: 3 users, 1 project, 12 tasks, 3 comments, 4 activities"

# 4. Boot dev
npm run dev         # → http://localhost:3000
```

**Demo creds** (also on the `/login` page): `admin@demo.com / admin123`, `manager@demo.com / manager123`, `member@demo.com / member123`.

**If anything breaks, check §12 (Gotchas) first** — most Day 1 errors were already hit and fixed.
