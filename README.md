# SynergyIQ — Smart Project & Task Collaboration

> **Plan less, ship more.** A full-stack team hub for projects, tasks, and conversations — with Kanban,
> activity, analytics, and real-time notifications. Built end-to-end in 4 days for the **EAP 4.0
> Assessment Task**.

| | |
|---|---|
| **Live demo** | _Add your Vercel URL here after deploy_ |
| **Repo** | [`iammhador/synergyiq`](https://github.com/iammhador/synergyiq) |
| **Stack** | Next.js 15 App Router · TypeScript · MongoDB · Auth.js v5 · Tailwind v4 · Recharts |

> **Status:** Day 1–4 complete — auth, projects, tasks, comments, notifications, team, search,
> analytics, security headers, deploy-ready. See [`agent.md`](./agent.md) for full project context and
> [`skills.md`](./skills.md) for a feature-by-feature status inventory.

---

## What's inside

| Area | What you get |
|---|---|
| **Auth** | Email + password, JWT sessions, role on the token (`admin` / `manager` / `member`), bcrypt hashing, edge middleware redirect for protected routes |
| **Projects** | CRUD, member management, status (`active` / `on_hold` / `completed`), deadlines, progress rollups |
| **Tasks** | CRUD, Kanban board with drag/drop between columns, priorities, due dates, assignments, inline status changes |
| **Comments** | Per-task threaded comments, mentions via notifications |
| **Notifications** | Bell in header with unread badge, dropdown, dedicated `/notifications` page, real-time refresh (30s) |
| **Team** | Admin-only `/team` page with workload per member, role change, search |
| **My Tasks** | `/tasks` "mine" view grouped by status with quick-advance buttons and overdue highlighting |
| **Search** | Global `/search` with debounce — projects, tasks, comments, people across the workspace |
| **Analytics** | `/analytics` with 4 Recharts visualisations — tasks by status, tasks by priority, project progress, 14-day activity |
| **Theme** | Light / dark / system, persisted to localStorage, SSR-safe with `suppressHydrationWarning` |
| **Security** | CSP, X-Frame-Options DENY, HSTS, Referrer-Policy, Permissions-Policy, no powered-by header |
| **Errors** | Root + route-group error boundaries, root + 404, and `loading.tsx` skeletons at both levels |

---

## Tech stack (locked)

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 15.1** (App Router) | Server actions, route handlers, streaming |
| Language | **TypeScript strict** | Catch mismatches at build time |
| Styling | **Tailwind v4** (CSS-first, no `tailwind.config.ts`) | Tighter v4 ergonomics |
| DB | **MongoDB** + **Mongoose 8** | Local for dev, Atlas for prod |
| Auth | **next-auth@5.0.0-beta.25** (Credentials, JWT) | Role on the session token, edge middleware |
| State | **Redux Toolkit** (client) + **SWR** (server cache) | Right tool for each job — no TanStack Query |
| Forms | **react-hook-form** + **Zod v3** | Shared validation, no v4 quirks |
| Charts | **Recharts** | Native SVG, themable via CSS vars |
| Icons | **lucide-react** | Tree-shakeable, consistent stroke |
| Toasts | **react-hot-toast** | Tiny, no provider boilerplate |
| Dates | **date-fns** | Smaller than moment, tree-shakeable |

---

## Getting started

### 1. Prerequisites

- **Node.js 20+** and **npm**
- **MongoDB** running locally on `mongodb://127.0.0.1:27017` *(or use Atlas — see [Deployment](#deployment))*

### 2. Install + configure

```bash
npm install
cp .env.example .env.local       # then edit secrets
```

Required env vars (full list in `.env.example`):

| Var | Dev value |
|---|---|
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/synergyiq` |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `http://localhost:3000` |

### 3. Seed the database

```bash
npm run seed
```

Creates 3 demo users, 2 projects, ~24 tasks, several comments, notifications, and an activity log.

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Admin | `admin@demo.com` | `admin123` |
| Manager | `manager@demo.com` | `manager123` |
| Member | `member@demo.com` | `member123` |

The `/login` page has one-click "Try as Admin / Manager / Member" buttons.

---

## Available scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start the dev server with fast refresh |
| `npm run build` | Production build (Vercel target) |
| `npm start` | Serve the production build |
| `npm run seed` | Wipe + re-seed the DB with demo data |
| `npm run typecheck` | `tsc --noEmit` — **must be 0 errors before every commit** |

> No `lint` script is wired in by design — the project relies on **TypeScript strict** + **`tsc --noEmit`**
> as the primary safety net. Add ESLint only if the team has a clear config preference.

---

## Project structure

```
app/                       Next.js App Router
  (app)/                   Authenticated routes (dashboard, projects, /team, /tasks, /search, /analytics, /notifications, /activity, /settings)
    layout.tsx             AppShell + auth gate (redirects to /login if no session)
    loading.tsx            Skeleton fallback
    error.tsx              App-level error boundary
  (auth)/                  Login + signup
  api/                     Route handlers (auth, projects, tasks, users, comments, notifications, search, analytics)
  loading.tsx              Root skeleton
  error.tsx                Root error boundary
  not-found.tsx            404
  layout.tsx               Root providers (Redux, next-auth, theme)
components/
  layout/                  AppShell, Sidebar, Header, NotificationBell, ThemeToggle, PageHeader, Logo
  ui/                      Hand-rolled primitives: Avatar, Badge, Button, Card, DataTable, Dropdown, EmptyState, Input, Modal, Pagination, Progress, Select, Skeleton, Textarea, Toaster
  providers/               AuthProvider
lib/
  auth/                    NextAuth config, Edge middleware, RBAC rank helper, role constants
  db/                      Hot-reload-safe Mongoose connection
  models/                  User, Project, Task, Comment, Activity, Notification
  redux/                   store + slices (auth, ui)
  swr/                     Centralized fetcher + cache keys
  utils/                   cn, format, result, activity (logActivity helper)
  validations/             Zod schemas
hooks/                     useDebounce, useLocalStorage, useMediaQuery, useClickOutside, useProjects/useTasks/useUsers/useTeam/useNotifications/useSearch/useAnalytics
actions/                   Server actions: auth, projects, tasks, comments, users, notifications
scripts/seed.ts            Demo data seeder
agent.md                   ⭐ Full project context for any AI agent (read this first)
skills.md                  ⭐ Feature-by-feature status inventory
.env.example               ⭐ Env template (copy → .env.local)
```

---

## Design system

- **Brand:** Indigo-on-slate, light & dark
- **Typography:** Geist Sans + Geist Mono via `next/font/google`
- **Tokens:** CSS variables on `:root` (and `[data-theme="dark"]`) — `--primary`, `--surface`, `--surface-elevated`, `--border`, `--muted`, `--muted-foreground`, `--success`, `--warning`, `--danger`
- **Recharts** reads the same tokens (`stroke="var(--primary)"`, `fill="var(--border)"`, etc.) so charts follow the active theme automatically

---

## RBAC matrix

| Action | Admin | Manager | Member |
|---|:---:|:---:|:---:|
| View any project they belong to | ✅ | ✅ | ✅ |
| Create a project | ✅ | ✅ | ❌ |
| Edit any project / change status | ✅ | ✅ | Owner only |
| Delete a project | ✅ | ❌ | Owner only |
| Create / edit / delete tasks | ✅ | ✅ | In projects they own |
| Assign a task to someone | ✅ | ✅ | In projects they own |
| Comment on tasks | ✅ | ✅ | ✅ (project member) |
| Open `/team` (workload + role change) | ✅ | ❌ | ❌ |
| Change another user's role | ✅ | ❌ | ❌ |
| View `/analytics` (org-wide) | ✅ | ✅ (own projects) | ✅ (own projects) |

---

## Deployment

> The app is Vercel-ready. Atlas is the recommended database for production.

### 1. Database — MongoDB Atlas

1. Create a free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
2. **Database Access** → add a user with `readWrite` on `synergyiq`.
3. **Network Access** → allow Vercel's IP range (or `0.0.0.0/0` for ease).
4. Copy the connection string: `mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/synergyiq?retryWrites=true&w=majority`.

### 2. Vercel

1. Push the repo to GitHub.
2. Import into Vercel (framework auto-detected as Next.js).
3. Set env vars in **Project Settings → Environment Variables**:
   - `MONGODB_URI` → the Atlas connection string
   - `AUTH_SECRET` → `openssl rand -base64 32`
   - `NEXTAUTH_URL` → `https://<your-app>.vercel.app`
4. Deploy. The build runs `next build`, then `npm start` serves it.

### 3. Post-deploy checks

- Hit `/` — should redirect signed-in users to `/dashboard`, others to landing.
- Sign in as `admin@demo.com` / `admin123` — the seeder runs against the dev DB; for prod you'll want
  to either run the seeder once against Atlas, or sign up via `/signup` to create your first user.
- Open browser devtools → **Network** — confirm `X-Frame-Options: DENY`, `Strict-Transport-Security`,
  `Content-Security-Policy` headers are present on responses.

---
