# SynergyIQ — Smart Project & Task Collaboration System

A full-stack team project hub: workspaces, tasks, Kanban, real-time activity, and analytics.
Built for the **EAP 4.0 Assessment Task** (4-day deadline).

> **Status:** Day 1 complete (auth + foundation). See [`agent.md`](./agent.md) for full project context
> and [`skills.md`](./skills.md) for a status-by-status skill inventory. Pick up at the **Projects +
> Tasks CRUD** todo.

---

## Tech Stack (locked)

- **Next.js 15.1** (App Router) + **TypeScript strict** + **Tailwind CSS v4** (CSS-first, no `tailwind.config.ts`)
- **MongoDB** (local) + **Mongoose 8** — swap to Atlas connection string at deploy
- **Auth.js v5** (next-auth@5 beta) with Credentials provider, JWT sessions, role in token
- **Redux Toolkit** (client state: auth + ui) + **SWR** (server cache) — *no* TanStack Query
- **React Hook Form + Zod v3** — *not* v4
- **Recharts** (analytics), **lucide-react** (icons), **react-hot-toast**, **date-fns**

---

## Getting Started

### 1. Prerequisites

- Node.js 20+ and npm
- MongoDB running locally on `mongodb://127.0.0.1:27017` (or use MongoDB Atlas)

### 2. Install + configure

```bash
npm install
cp .env.example .env.local       # then edit secrets
```

Required env vars (see `.env.example`):
- `MONGODB_URI` — local: `mongodb://127.0.0.1:27017/synergyiq`
- `AUTH_SECRET` — generate with `openssl rand -base64 32`
- `NEXTAUTH_URL` — `http://localhost:3000` for dev

### 3. Seed the database

```bash
npm run seed
```

Creates 3 demo users, 1 project, 12 tasks, 3 comments, and 4 activity entries.

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Demo Credentials

| Role   | Email                | Password    |
|--------|----------------------|-------------|
| Admin  | `admin@demo.com`     | `admin123`  |
| Member | `member@demo.com`    | `member123` |
| Viewer | `viewer@demo.com`    | `viewer123` |

Use the **"Try demo as Admin / Member / Viewer"** buttons on `/login` for one-click sign-in.

---

## Available Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start the dev server (Turbopack-free, fast refresh) |
| `npm run build` | Production build |
| `npm start` | Run the production build |
| `npm run lint` | ESLint pass |
| `npm run typecheck` | `tsc --noEmit` — must show 0 errors before committing |
| `npm run seed` | Wipe and re-seed the DB with demo data |

---

## Project Structure

```
app/                   # Next.js App Router
  (app)/               # Authenticated routes (dashboard, projects, team, …)
  api/                 # Route handlers (auth, signup)
  login/, signup/      # Public auth pages
components/
  layout/              # AppShell, Sidebar, Header, MobileSidebar
  ui/                  # 14 hand-rolled primitives (Button, Input, Modal, …)
  providers/           # AuthProvider, StoreProvider
lib/
  auth/                # NextAuth config, middleware, RBAC rank helper
  db/                  # Hot-reload-safe Mongoose connection
  models/              # User, Project, Task, Comment, Activity, Notification
  redux/               # store + slices (auth, ui)
  swr/                 # Centralized fetcher + cache keys
  utils/               # cn, format, result, activity (logActivity helper)
  validations/         # Zod schemas
hooks/                 # useDebounce, useLocalStorage, useMediaQuery, useClickOutside
scripts/seed.ts        # Demo data seeder
agent.md               # ⭐ Full project context for any AI agent
skills.md              # ⭐ Skill-by-skill status inventory
.env.example           # ⭐ Env template (copy → .env.local)
```

---

## Deployment

1. Push to a GitHub repo.
2. Import into Vercel.
3. Set env vars in Vercel dashboard (use the **Atlas** connection string, not local).
4. Deploy.

See `agent.md` → "Deployment" for the full checklist (security headers, build verification, Atlas swap).

---

## License

Internal — EAP 4.0 assessment submission.
