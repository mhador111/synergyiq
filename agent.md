# SynergyIQ — AI Agent Context

> This file is the **single source of truth** for any AI agent (or human) continuing work on this project. Read it first, then check the current `package.json` and the date of the most recent commit before doing anything. If something here contradicts the live code, the **live code wins** — update this file.

---

## 1. Project Identity

| | |
|---|---|
| **Name** | **SynergyIQ** — Smart Project & Task Collaboration System |
| **Type** | Full-stack web app (assessment deliverable, 4-day deadline) |
| **Repo root** | `project-collab/` |
| **Deploy target** | Vercel (with MongoDB Atlas free tier) |
| **Brand palette** | Indigo-on-slate (light & dark) |
| **Typography** | Geist Sans + Geist Mono via `next/font` |

The brand name **must always be "SynergyIQ"** — do not rename to "project-collab" or "Smart PM". The directory name `project-collab` is just a leftover from `create-next-app`.

---

## 2. Tech Stack (LOCKED — do not change without strong reason)

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js 15.1** (App Router) | RSC first, server actions for mutations |
| Language | **TypeScript** `^5.7.2` strict | `"strict": true` in `tsconfig.json` |
| Styling | **Tailwind CSS v4** (CSS-first) | `@import "tailwindcss"` in `globals.css`. **No** `tailwind.config.{js,ts}`. Use `@custom-variant` and `@theme` at-rules. |
| UI primitives | **Hand-rolled Tailwind components** | `components/ui/*` — **no** shadcn, **no** Radix. Forward refs, cva-like variants. |
| Icons | `lucide-react` | Stroke icons only, no emoji in UI text |
| State (client) | **Redux Toolkit** | Only auth + UI slices. NO project/task data in Redux. |
| State (server) | **SWR** | All server data fetched client-side via SWR hooks |
| Forms | **react-hook-form** + **zod** `^3.24` | ⚠ **Zod v3 only** — use `z.string().email()`, NOT `z.email()` |
| Validation | **Zod v3** | Reused for forms AND server-action input validation |
| Auth | **next-auth@5.0.0-beta.25** (Auth.js v5) | Credentials provider, JWT sessions, role in token |
| Password hashing | `bcryptjs` | 10 rounds |
| DB | **MongoDB** local now, Atlas at deploy | Mongoose 8 hot-reload safe pattern in `lib/db/mongoose.ts` |
| Charts | `recharts` | Client components only (`"use client"`) |
| Toasts | `react-hot-toast` | Custom `<Toaster />` in `components/ui/` |
| Dates | `date-fns` | v4 |
| Dev script runner | `tsx` | For `scripts/seed.ts` |
| Env loading (scripts) | `dotenv` | `import "dotenv/config"` (loads `.env` only — `lib/db/mongoose.ts` has a fallback URI) |

**Forbidden:**
- ❌ `shadcn-ui` / `@radix-ui/*` (we have our own primitives)
- ❌ Zustand, Jotai, Recoil (Redux + SWR is the contract)
- ❌ TanStack Query (SWR is the contract)
- ❌ Prisma (Mongoose is the contract)
- ❌ Upstash/Redis (overkill for this assessment)

---

## 3. Directory Map

```
project-collab/
├── app/
│   ├── (auth)/                  # login + signup, centered card layout
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (app)/                   # protected, wrapped in <AppShell>
│   │   ├── layout.tsx           # auth() guard → redirect("/login")
│   │   └── dashboard/page.tsx   # KPI cards + recent projects
│   ├── api/auth/
│   │   ├── [...nextauth]/route.ts
│   │   └── signup/route.ts
│   ├── layout.tsx               # ROOT — fonts, providers, toaster
│   ├── globals.css              # Tailwind v4 @import + @theme tokens
│   └── page.tsx                 # Branded landing (server component)
├── components/
│   ├── ui/                      # 14 primitives + index.ts barrel
│   ├── layout/                  # Logo, Sidebar, Header, AppShell, PageHeader, MobileSidebar, ThemeToggle
│   └── providers/AuthProvider.tsx
├── lib/
│   ├── auth/auth.ts             # NextAuth config (Credentials, JWT, role)
│   ├── auth/rbac.ts             # hasRole() rank-based helper
│   ├── db/mongoose.ts           # Hot-reload safe connection
│   ├── models/                  # 6 models: User, Project, Task, Comment, Activity, Notification
│   ├── redux/
│   │   ├── store.ts
│   │   ├── hooks.ts             # typed useAppDispatch/useAppSelector
│   │   ├── provider.tsx         # <StoreProvider> client component
│   │   └── slices/
│   │       ├── authSlice.ts
│   │       └── uiSlice.ts       # includes closeSidebar (used by MobileSidebar)
│   ├── swr/
│   │   ├── fetcher.ts
│   │   └── keys.ts
│   ├── utils/
│   │   ├── cn.ts                # clsx + tailwind-merge
│   │   ├── format.ts            # date / number formatters
│   │   ├── activity.ts          # logActivity() helper
│   │   └── slug.ts
│   └── validations/             # Zod v3 schemas: auth, project, task, comment
├── hooks/                       # useAuth, useDebounce, useMediaQuery, useClickOutside
├── actions/                     # Server actions (Day 2)
├── types/                       # Shared TS types (next-auth.d.ts, etc.)
├── scripts/seed.ts              # tsx scripts/seed.ts → npm run seed
├── agent.md                     # ← YOU ARE HERE
├── skills.md                    # skills used + status
├── README.md                    # user-facing docs (set up, env, demo creds, deploy)
└── .env.local                   # MONGODB_URI, AUTH_SECRET, etc. (gitignored)
```

---

## 4. Naming & Convention Cheat-Sheet

These mistakes have been made before. **Do not repeat them.**

| Rule | Correct | Wrong |
|---|---|---|
| Model exports | `export const User = ...` | `export const UserModel = ...` (was renamed in fix cascade) |
| Zod email | `z.string().email()` | `z.email()` (that's v4 syntax) |
| tsconfig paths | `"@/*": ["./*"]` (no `src/`) | `"./src/*"` (default create-next-app value) |
| Mongoose import | `import "mongoose"` (side-effect) or `import mongoose from "mongoose"` for the namespace | default-style for Mongoose (has no default export) |
| Task status enum | `todo` \| `in_progress` \| `completed` | `done` (not in schema) |
| Task priority enum | `high` \| `medium` \| `low` | `urgent` (not in schema) |
| Activity type enum | `project_created`, `task_created`, `task_status_changed`… (snake_case) | `project.created` (dot notation) |
| Activity required | `message` is **required** | omitting `message` (validation fails) |
| Tailwind v4 tokens | `@theme { --color-primary: ...; }` in `globals.css` | `tailwind.config.ts` `theme.extend.colors` |
| Tailwind v4 dark mode | `@custom-variant dark (&:where(.dark, .dark *));` | `darkMode: "class"` in config |
| Role ranks | `admin(3) > manager(2) > member(1)` | string compare (wrong) |
| Session user typing | `declare module "next-auth" { interface Session { user: { id, role } } }` in `types/next-auth.d.ts` | casting in every file |

---

## 5. Data Model (Mongoose)

All models live in `lib/models/*.ts` and are exported as **bare names** (`User`, `Project`, `Task`, `Comment`, `Activity`, `Notification`).

### User
- `name: string`
- `email: string` unique
- `passwordHash: string` (bcrypt 10)
- `role: "admin" | "manager" | "member"` enum
- `avatarUrl?: string`
- timestamps

### Project
- `name: string` (≤ 80)
- `description?: string` (≤ 2000)
- `status: "active" | "completed" | "archived"` (default `active`)
- `ownerId: ObjectId<User>`
- `memberIds: ObjectId<User>[]`
- `deadline?: Date`
- timestamps

### Task
- `title: string` (≤ 200)
- `description?: string` (≤ 5000)
- `projectId: ObjectId<Project>` indexed
- `assigneeId?: ObjectId<User>` indexed
- `createdBy: ObjectId<User>`
- `priority: "high" | "medium" | "low"` (default `medium`)
- `status: "todo" | "in_progress" | "completed"` (default `todo`) indexed
- `dueDate?: Date`
- `position: number` (for Kanban ordering within a column)
- timestamps

### Comment
- `taskId: ObjectId<Task>` indexed
- `authorId: ObjectId<User>`
- `body: string` (≤ 2000)
- timestamps

### Activity
- `type: enum` — `project_created | project_updated | project_deleted | task_created | task_updated | task_status_changed | task_assigned | task_deleted | member_added | member_removed | comment_added` (snake_case, **no dots**)
- `actorId: ObjectId<User>` indexed
- `projectId?: ObjectId<Project>` indexed
- `taskId?: ObjectId<Task>` indexed
- `targetUserId?: ObjectId<User>`
- `message: string` **(required)**
- timestamps

### Notification
- `userId: ObjectId<User>` indexed
- `type: string`
- `title: string`
- `body?: string`
- `link?: string`
- `read: boolean` (default `false`) indexed
- timestamps

---

## 6. Auth & RBAC

- `lib/auth/auth.ts` exports `{ handlers, auth, signIn, signOut }` from `NextAuth(authConfig)`.
- `auth()` is the **server-side** session reader. Returns `Session | null` — always null-check.
- `pages.signIn = "/login"`.
- `session.strategy = "jwt"`.
- `trustHost: true` (required for Vercel preview deployments).
- Role is added in **two callbacks**:
  - `jwt({ token, user })` — copy `user.id` and `user.role` into the token on first sign-in
  - `session({ session, token })` — copy back into `session.user`
- `lib/auth/rbac.ts` has `hasRole(user, "manager")` using a numeric rank.
- Middleware: `middleware.ts` at root protects `/dashboard`, `/projects`, `/tasks`, `/team`, `/analytics` (Day 2+).

---

## 7. State Boundaries

| Data lives in | Tool | Examples |
|---|---|---|
| Auth state (current user) | Redux `authSlice` | `{ user, isAuthenticated }` |
| UI state (sidebar open, theme) | Redux `uiSlice` | `{ sidebarOpen, theme }` |
| **Server data** (projects, tasks, users) | **SWR** (with key in `lib/swr/keys.ts`) | `useProjects()`, `useTasks(projectId)` |
| Form state | react-hook-form local | login, signup, create-project, etc. |
| URL state | `useSearchParams` (read) / `router.replace` (write) | filters, pagination, search query |

**Rule:** do NOT put project/task data in Redux. Always fetch via SWR.

---

## 8. Design Tokens (Tailwind v4 in `globals.css`)

```
--color-bg / --color-surface / --color-elevated
--color-fg / --color-muted / --color-subtle
--color-border / --color-ring
--color-primary (indigo-600) / --color-primary-fg
--color-success / --color-warn / --color-danger
--radius-sm/md/lg/xl
--shadow-sm/md/lg
--font-sans (Geist) / --font-mono (Geist Mono)
--animate-fade-in / --animate-slide-up / --animate-scale-in / --animate-shimmer
```

Dark mode via `.dark` class on `<html>`, switched by `ThemeToggle` and persisted in `localStorage`.

---

## 9. Setup & Run

```bash
# 1. Install
cd project-collab
npm install

# 2. Env (MONGODB_URI is also the local fallback used by mongoose.ts)
cp .env.example .env.local
# Edit .env.local:
#   MONGODB_URI=mongodb://127.0.0.1:27017/synergyiq
#   AUTH_SECRET=<openssl rand -base64 32>
#   NEXTAUTH_URL=http://localhost:3000

# 3. Make sure mongod is running locally
mongod --dbpath /var/lib/mongodb  # or your preferred path

# 4. Seed demo data
npm run seed
# → 3 users, 1 project, 12 tasks, 3 comments, 4 activities

# 5. Dev
npm run dev
# → http://localhost:3000
```

### Demo accounts
| Role | Email | Password |
|---|---|---|
| admin | admin@demo.com | admin123 |
| manager | manager@demo.com | manager123 |
| member | member@demo.com | member123 |

---

## 10. Roadmap (4-day plan)

| Day | Focus | Status |
|---|---|---|
| **1** | Project init, deps, models, auth, Redux, SWR, UI lib, layout shell, landing + login + signup + dashboard skeleton, seed | ✅ **DONE** (verified end-to-end: `tsc` clean, `npm run seed` writes 3 users / 1 project / 12 tasks / 3 comments / 4 activities; `POST /api/auth/callback/credentials` returns 302 with session cookie; `/dashboard` returns 200 for authenticated users, 307 to `/login` otherwise) |
| **2** | Projects + Tasks core CRUD. Server actions in `actions/`, project list (DataTable), project detail (Kanban), task CRUD, status updates, activity log wired through `logActivity()` | ⏳ next |
| **3** | Team page (invite, role change, workload), task comments, notification center, global search with debounce, analytics page (Recharts) | ⏳ |
| **4** | Loading/error boundaries, security headers, README, **agent.md + skills.md** (this file), `.env.example`, lint pass, Vercel deploy with Atlas | ⏳ |

---

## 11. What Worked / What to Avoid

### Worked
- Next.js 15 App Router + Server Actions keeps the API surface minimal — no need for `/api/projects` routes.
- Hand-rolled UI primitives in `components/ui/` are ~50 LOC each and give us full control over the indigo-on-slate palette.
- Mongoose `lean()` for read-only queries on dashboards (avoids hydration overhead).
- `connectDB()` with the global `cached` pattern prevents the dev-server reconnect storm.
- SWR with a single `fetcher` makes every list page a 3-line hook.

### Avoid
- **Don't** put server data in Redux. Use SWR.
- **Don't** add a `tailwind.config.ts` — Tailwind v4 is fully configured in `globals.css`.
- **Don't** use Zod v4 syntax (`z.email()`) — the installed version is 3.x.
- **Don't** rename model exports with a `Model` suffix — code imports them as `User`, `Project`, etc.
- **Don't** add a default `mongoose` import unless you actually use the namespace (just `import "mongoose"` if you only need side-effects like the connection).

---

## 12. Quick File-to-Feature Index

| Feature | Files |
|---|---|
| Landing | `app/page.tsx`, `app/globals.css` |
| Login | `app/(auth)/login/page.tsx`, `lib/validations/auth.ts`, `app/api/auth/[...nextauth]/route.ts` |
| Signup | `app/(auth)/signup/page.tsx`, `app/api/auth/signup/route.ts` |
| Dashboard | `app/(app)/dashboard/page.tsx`, `app/(app)/layout.tsx`, `components/layout/AppShell.tsx` |
| Models | `lib/models/{user,project,task,comment,activity,notification}.ts` |
| Seed | `scripts/seed.ts` |
| Auth config | `lib/auth/auth.ts`, `lib/auth/rbac.ts`, `middleware.ts` |
| Redux | `lib/redux/store.ts`, `lib/redux/slices/{authSlice,uiSlice}.ts`, `lib/redux/provider.tsx` |
| SWR | `lib/swr/{fetcher,keys}.ts` |
| UI lib | `components/ui/{Button,Input,Card,Badge,...}.tsx` + `index.ts` |
| Layout shell | `components/layout/{Sidebar,Header,AppShell,MobileSidebar,PageHeader,Logo,ThemeToggle}.tsx` |

---

## 13. Definition of Done (per feature)

1. TypeScript: `npm run typecheck` passes.
2. Renders without console errors on `npm run dev`.
3. Mobile + desktop breakpoints both look clean.
4. Dark mode looks right (no white flashes).
5. RBAC enforced — `member` cannot access admin-only actions.
6. `logActivity()` called for every mutation that should show up in the activity feed.
7. A SWR key + fetcher is used for any new list view (no Redux for server data).
---

## 14. Handoff Checklist (start of any new session)

Before doing anything else, run these three commands and confirm output:

```bash
node -v          # expect v20+
npm -v           # expect v10+
ls .env.local    # must exist; if not, run: cp .env.example .env.local
```

Then:

```bash
npm run typecheck    # expect: 0 errors
npm run seed         # expect: "✓ Seeded: 3 users, 1 project, 12 tasks, 3 comments, 4 activities"
npm run dev          # open http://localhost:3000
```

If `npm run dev` silently 500s on first request, you forgot to install `@tailwindcss/postcss` — re-run the gotcha list in [`skills.md` §12](./skills.md).

**Next-up todo:** Projects + Tasks core CRUD (server actions + SWR hooks + Kanban board) — see `skills.md` §5 (Server State) and §9 (Server Actions) for the current ⬜ list.