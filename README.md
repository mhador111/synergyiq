# SynergyIQ — Smart Project & Task Collaboration

> **Plan less, ship more.** A full-stack team hub for projects, tasks, and conversations — with Kanban, activity, analytics, and real-time notifications. Built for the **EAP 4.0 Assessment Task**.

![Status](https://img.shields.io/badge/status-production%20ready-4f46e5?style=flat-square)
![Next.js](https://img.shields.io/badge/Next.js-15.1-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?style=flat-square&logo=typescript)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%208-47a248?style=flat-square&logo=mongodb)
![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)

| | |
|---|---|
| **Live demo** | _Add your Vercel URL here after deploy_ |
| **Repo** | [`iammhador/synergyiq`](https://github.com/iammhador/synergyiq) |
| **Stack** | Next.js 15 App Router · TypeScript · MongoDB · Auth.js v5 · Tailwind v4 · Recharts |

> **Status:** Production-ready — auth, projects, tasks, comments, notifications, team, search,
> analytics, and security headers all in place. See [`agent.md`](./agent.md) for full project context and
> [`skills.md`](./skills.md) for a feature-by-feature status inventory.
>
> 🤖 **AI-assisted build:** This project was designed and implemented with the help of an AI coding
> assistant. All architecture, code, and content are reviewed and owned by the author.

---

## 📑 Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Project Setup](#project-setup)
5. [Environment Variables](#environment-variables)
6. [Demo Credentials](#demo-credentials)
7. [Deployment](#deployment)
8. [Project Structure](#project-structure)
9. [Design System](#design-system)
10. [RBAC Matrix](#rbac-matrix)
11. [Available Scripts](#available-scripts)
12. [Post-Deployment Checklist](#post-deployment-checklist)
13. [Troubleshooting & Gotchas](#troubleshooting--gotchas)
14. [License](#license)

---

## Overview

**SynergyIQ** is a production-grade team collaboration platform that brings project management, task tracking, and team communication into a single, fast interface. It ships with:

- 🔐 **Role-based authentication** (admin / manager / member) backed by Auth.js v5 + JWT
- 📋 **Kanban-style task boards** with drag/drop, priorities, due dates, and inline status changes
- 💬 **Threaded comments** with @mentions and real-time notification fan-out
- 📊 **Live analytics** powered by Recharts (tasks by status/priority, project progress, 14-day activity)
- 🔍 **Global search** across projects, tasks, comments, and people
- 🛡️ **Hardened security**: CSP, HSTS, X-Frame-Options DENY, Permissions-Policy, and `poweredByHeader: false`
- 🌓 **Theming** (light / dark / system) with SSR-safe hydration

Designed to be **Vercel-ready** out of the box — push, import, set env vars, deploy.

---

## Features

### 🔑 Authentication & Authorization
- Email + password login with bcrypt hashing
- JWT sessions with **role embedded in the token** (admin / manager / member)
- Edge middleware that redirects unauthenticated users from protected routes
- Server-side `auth()` guards in `(app)/layout.tsx` as a second line of defense
- One-click "Try as Admin / Manager / Member" demo buttons on `/login`

### 📁 Project Management
- Full CRUD for projects with status (`active` / `on_hold` / `completed`)
- Member management (add / remove) with ownership tracking
- Deadlines, progress rollups, and status filtering
- DataTable view with search + status filter at `/projects`

### ✅ Task Management
- Full CRUD with priorities (`high` / `medium` / `low`) and due dates
- **Kanban board** with drag/drop between `todo` / `in_progress` / `completed` columns
- Optimistic UI updates with SWR revalidation
- Inline quick-advance buttons on `/tasks` (my tasks view)
- Overdue highlighting and project deep-links

### 💬 Collaboration
- Per-task threaded comments
- @mentions trigger notifications to mentioned users
- Activity log (`project_created`, `task_status_changed`, `comment_added`, etc.)
- Real-time notification refresh (30s) with unread badge in header

### 👥 Team & Workload
- Admin-only `/team` page with workload per member
- Role change functionality (admin gated)
- Search across team members

### 🔍 Search & Analytics
- Global `/search` with 250ms debounce — projects, tasks, comments, and people
- `/analytics` dashboard with 4 Recharts visualizations:
  - Tasks by status (pie)
  - Tasks by priority (bar)
  - Project progress (custom horizontal bars)
  - 14-day activity timeline (line)

### 🎨 UX & Quality
- Light / dark / system theme, persisted to localStorage, SSR-safe
- Root + route-group `error.tsx` boundaries, `loading.tsx` skeletons, and `not-found.tsx` 404
- Hand-rolled UI primitives in `components/ui/` (Button, Card, Modal, DataTable, etc.)
- Toast notifications via `react-hot-toast`

---

## Tech Stack

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

## Project Setup

### Prerequisites

Before you begin, make sure you have:

- **Node.js 20+** and **npm** (Node 20 LTS or later)
- **MongoDB** running locally on `mongodb://127.0.0.1:27017`
  - _Or_ a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster (recommended for production)
- **Git** for cloning the repo

### Step 1 — Clone & install

```bash
git clone https://github.com/iammhador/synergyiq.git
cd synergyiq
npm install
```

### Step 2 — Configure environment

Copy the example env file and fill in your secrets:

```bash
cp .env.example .env.local
```

Then edit `.env.local` with your values. See the full [Environment Variables](#environment-variables) section below.

### Step 3 — Seed the database

The seeder wipes and re-creates demo data (3 users, 2 projects, ~24 tasks, comments, notifications, and an activity log):

```bash
npm run seed
```

> **Note:** Make sure `mongod` is running locally, or that your `MONGODB_URI` points to a reachable Atlas cluster.

### Step 4 — Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with one of the [demo accounts](#demo-credentials).

### Step 5 — Verify the build (optional but recommended)

```bash
npm run typecheck   # tsc --noEmit — must report 0 errors
npm run build       # Production build
```

---

## Environment Variables

All env vars live in `.env.local` (git-ignored). The template is in `.env.example`.

| Variable | Required | Dev value | Description |
|---|---|---|---|
| `MONGODB_URI` | ✅ | `mongodb://127.0.0.1:27017/synergyiq` | MongoDB connection string. Use `mongodb+srv://…` for Atlas. |
| `AUTH_SECRET` | ✅ | `openssl rand -base64 32` | Secret used to sign JWT session tokens. **Never commit this.** |
| `NEXTAUTH_URL` | ✅ | `http://localhost:3000` | Public URL of the app. Update to your Vercel domain in production. |
| `NEXT_PUBLIC_APP_NAME` | ⬜ | `"SynergyIQ"` | Public app name exposed to the client. |

### Generating `AUTH_SECRET`

```bash
openssl rand -base64 32
```

### Example `.env.local`

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017/synergyiq
AUTH_SECRET=kJ8...your-32-byte-random-string...xQ=
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="SynergyIQ"
```

> **Security note:** `.env.local` is git-ignored by default. Only `.env.example` is committed to the repo.

---

## Demo Credentials

The seeder creates three demo accounts. The `/login` page also has one-click "Try as Admin / Manager / Member" buttons for fast exploration.

| Role | Email | Password | Capabilities |
|---|---|---|---|
| **Admin** | `admin@demo.com` | `admin123` | Full access — `/team`, role changes, delete any project, org-wide analytics |
| **Manager** | `manager@demo.com` | `manager123` | Create projects, manage tasks, assign members, edit own projects |
| **Member** | `member@demo.com` | `member123` | View projects they belong to, comment, manage tasks in projects they own |

> **Production warning:** These credentials are for demo only. Before deploying, either run `npm run seed` once against your production Atlas DB **or** create your first real user via the `/signup` page and disable the demo buttons.

---

## Deployment

SynergyIQ is **Vercel-ready**. The recommended production database is **MongoDB Atlas**.

### 1. Database — MongoDB Atlas

1. Create a free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
2. **Database Access** → add a user with `readWrite` permission on the `synergyiq` database.
3. **Network Access** → allow Vercel's IP range, or `0.0.0.0/0` for simplicity.
4. Copy the connection string:
   ```
   mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/synergyiq?retryWrites=true&w=majority
   ```

### 2. Deploy to Vercel

#### Option A — Vercel Dashboard

1. Push the repo to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. Vercel auto-detects **Next.js** — no framework config needed.
4. In **Project Settings → Environment Variables**, add:
   - `MONGODB_URI` → your Atlas connection string
   - `AUTH_SECRET` → output of `openssl rand -base64 32`
   - `NEXTAUTH_URL` → `https://<your-app>.vercel.app`
5. Click **Deploy**. The build runs `next build`, then `npm start` serves the app.

#### Option B — Vercel CLI

```bash
npm i -g vercel
vercel login
vercel link
vercel env add MONGODB_URI production
vercel env add AUTH_SECRET production
vercel env add NEXTAUTH_URL production
vercel --prod
```

### 3. Seed the production database (one-time)

```bash
MONGODB_URI="mongodb+srv://..." NEXTAUTH_URL="https://<your-app>.vercel.app" npm run seed
```

> Alternatively, sign up via `/signup` on the live app to create your first real user.

### 4. Custom domain (optional)

In Vercel: **Project Settings → Domains → Add**. Then update `NEXTAUTH_URL` to match.

---

## Project Structure

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

## Design System

- **Brand:** Indigo-on-slate, light & dark
- **Typography:** Geist Sans + Geist Mono via `next/font/google`
- **Tokens:** CSS variables on `:root` (and `[data-theme="dark"]`) — `--primary`, `--surface`, `--surface-elevated`, `--border`, `--muted`, `--muted-foreground`, `--success`, `--warning`, `--danger`
- **Recharts** reads the same tokens (`stroke="var(--primary)"`, `fill="var(--border)"`, etc.) so charts follow the active theme automatically

---

## RBAC Matrix

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

## Available Scripts

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

## Post-Deployment Checklist

After deploying, verify the following:

- [ ] **Root redirect** — `GET /` should redirect signed-in users to `/dashboard`, others to the landing page.
- [ ] **Login flow** — Sign in as `admin@demo.com` / `admin123`. The seeder runs against the dev DB; for prod, run it once against Atlas **or** sign up via `/signup` to create your first real user.
- [ ] **Security headers** — Open browser devtools → **Network** and confirm the following response headers are present:
  - `X-Frame-Options: DENY`
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
  - `Content-Security-Policy` (with `frame-ancestors 'none'`)
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy` (camera / microphone / geolocation blocked)
  - **No** `X-Powered-By` header
- [ ] **Production seed** — If you ran the seeder against Atlas, confirm the demo accounts work end-to-end.
- [ ] **Custom domain** — If using a custom domain, update `NEXTAUTH_URL` in Vercel env vars and redeploy.

---

## Troubleshooting & Gotchas

These are known constraints worth keeping in mind. Hit one of these? Check here first.

1. **`tsconfig.json` paths must be `./*` not `./src/*`** — there is no `src/` dir. If you see "Cannot find module '@/...'", this is the first thing to check.
2. **Mongoose models are exported as bare names** (`User`, not `UserModel`). Code that imports them as `UserModel` is stale.
3. **Zod is v3, not v4** — use `z.string().email()`. `z.email()` will throw `z.email is not a function`.
4. **`uiSlice` must export `closeSidebar`** — `MobileSidebar` calls it. Don't remove it.
5. **`Task.status` enum is `todo | in_progress | completed`** — not `done`.
6. **`Task.priority` enum is `high | medium | low`** — not `urgent`.
7. **`Activity.type` is snake_case** — `project_created`, not `project.created`.
8. **`Activity.message` is required** — every `Activity.create()` call must include a human-readable string.
9. **`@tailwindcss/postcss` must be installed** alongside `tailwindcss`. Tailwind v4 will silently 500 without it.
10. **`session?.user` can be null** even inside `(app)/` routes during the brief moment before the layout's `redirect()` runs. Always null-check.
11. **Mongoose `lean()` returns `_id` as `ObjectId`** — for TS, cast explicitly to `mongoose.Types.ObjectId` in array maps.

---