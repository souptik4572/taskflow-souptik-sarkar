# TaskFlow

A full-stack task management app. Register, log in, create projects, add tasks, assign them to team members, and manage work across a list or Kanban board view.

---

## Live Deployment

The app is fully deployed and publicly accessible.

| Service | URL |
|---|---|
| Frontend (Netlify) | https://taskflow-souptik.netlify.app |
| Backend API (Heroku) | https://taskflow-souptik-acfb3c2f0786.herokuapp.com/api/v1 |
| Swagger API docs | https://taskflow-souptik-acfb3c2f0786.herokuapp.com/api-docs |
| Health check | https://taskflow-souptik-acfb3c2f0786.herokuapp.com/health |

> **Stack:** Frontend on Netlify, backend on Heroku, database on Neon (serverless PostgreSQL).

Use the [test credentials](#test-credentials) below to log straight in — no registration required.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js 20, Express 4, TypeScript (strict), Prisma ORM, PostgreSQL 16 |
| Auth | JWT (24h expiry) + bcryptjs (cost ≥ 12) |
| Validation | Joi |
| Logging | pino + pino-http (structured JSON) |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, React Router v6 |
| HTTP Client | Axios (with auth interceptors) |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable |
| Tests | Vitest + Supertest (integration tests) |
| Containers | Docker + docker-compose (three services: db, backend, frontend) |

---

## Running with Docker (Recommended)

**Prerequisites:** Docker and Docker Compose installed. No other tools required.

```bash
# 1. Clone the repo
git clone <repo>
cd taskflow-souptik-sarkar

# 2. Copy environment config — defaults work out of the box
cp .env.example .env

# 3. Start everything
docker compose up --build
```

That's it. On startup the backend container automatically:
1. Runs `prisma migrate deploy` — applies all pending migrations
2. Runs `prisma db seed` — seeds test data (idempotent, safe to re-run)
3. Starts the Express server

**Service URLs:**

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000/api/v1 |
| Swagger API docs | http://localhost:8000/api-docs |
| Health check | http://localhost:8000/health |

To stop: `docker compose down`
To stop and wipe the database volume: `docker compose down -v`

---

## Running Locally (Without Docker)

**Prerequisites:** Node.js 20+, a running PostgreSQL 16 instance.

### 1. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` and update `DATABASE_URL` to point to your local Postgres instance:

```
DATABASE_URL=postgresql://<user>:<password>@localhost:5432/<dbname>?schema=public
```

### 2. Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend (separate terminal)
cd frontend
npm install
```

### 3. Run database migrations

```bash
cd backend

# Apply all pending migrations to your local database
npm run migrate
```

> This runs `prisma migrate deploy` under the hood — applies committed migration files in order. It does **not** auto-generate new migrations or modify the schema.

### 4. Seed the database

```bash
cd backend
npm run seed
```

Seeds one project, four tasks, and two test users (see Test Credentials below).

### 5. Start the servers

```bash
# Terminal 1 — Backend (hot-reload)
cd backend
npm run dev

# Terminal 2 — Frontend (hot-reload)
cd frontend
npm run dev
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000/api/v1 |

---

## Database Migrations

Schema changes are managed exclusively through Prisma migration files — no `prisma db push`, no manual SQL dumps.

### Creating a new migration

```bash
cd backend

# 1. Edit prisma/schema.prisma with your changes

# 2. Generate a new migration file and apply it locally
npm run migrate:new -- --name <describe_your_change>
# e.g. npm run migrate:new -- --name add_task_labels
```

This creates a timestamped folder under `prisma/migrations/` with a `.sql` file. **Commit that file** — it is the source of truth and runs automatically on the next `docker compose up` or `npm run migrate`.

### Applying existing migrations

```bash
cd backend
npm run migrate
```

Runs `prisma migrate deploy` — applies any pending migration files in order. Safe to run multiple times.

---

## Test Credentials

| User | Email | Password |
|---|---|---|
| Primary | test@example.com | password123 |
| Alternate | testAlternate@example.com | password123 |

Pre-seeded with two projects and five tasks across different statuses and assignees:

| Project | Owner |
|---|---|
| [Test User] Website Redesign | test@example.com |
| [Test Alternate] Mobile App Launch | testAlternate@example.com |

| Task | Project | Creator | Assignee | Status |
|---|---|---|---|---|
| [Test User → Test User] Design homepage mockups | Website Redesign | Test User | Test User | To Do |
| [Test User → Test Alternate] Implement auth flow | Website Redesign | Test User | Test Alternate | In Progress |
| [Test User → Test Alternate] Write API documentation | Website Redesign | Test User | Test Alternate | Done |
| [Test Alternate → Test Alternate] Set up CI/CD pipeline | Mobile App Launch | Test Alternate | Test Alternate | To Do |
| [Test Alternate → Test User] Configure push notifications | Mobile App Launch | Test Alternate | Test User | In Progress |

---

## Running Tests

Tests are **integration tests** — they run against a real PostgreSQL database, not mocks. You need a running Postgres instance before running the suite.

### Prerequisites

- Node.js 20+
- A running PostgreSQL instance (can be the same one used for local dev)
- Dependencies installed: `cd backend && npm install`

### 1. Configure the test environment

The test runner loads `backend/.env.test` automatically (via `vitest.config.ts` → `src/__tests__/setup.ts`). Copy the example and point it at your test database:

```bash
# From the repo root
cp backend/.env.example backend/.env.test
```

Then edit `backend/.env.test` and set:

```env
DATABASE_URL=postgresql://<user>:<password>@localhost:5432/<test_dbname>?schema=public
ACCESS_SECRET_TOKEN=any_string_at_least_32_characters_long
JWT_EXPIRES_IN=1h
PORT=8099
NODE_ENV=test
BCRYPT_ROUNDS=12
```

> Use a **separate database** from your development database (`<test_dbname>` ≠ your dev db). The test suite cleans up after itself, but running against dev data risks accidental deletions.

### 2. Apply migrations to the test database

```bash
cd backend
DATABASE_URL=<your_test_db_url> npx prisma migrate deploy
```

### 3. Run the test suite

```bash
cd backend

# Run all tests once (CI mode)
npm test

# Run in watch mode — re-runs on file changes during development
npx vitest

# Run a single test file
npx vitest src/__tests__/auth.test.ts

# Run with verbose output (shows each test name)
npx vitest run --reporter=verbose
```

### What is covered

| Suite | Tests | What is verified |
|---|---|---|
| `POST /auth/register` | 3 | Success (201 + token), duplicate email (409), missing fields (400 + field errors) |
| `POST /auth/login` | 3 | Success (200 + token), wrong password (401), unknown email (401) |
| `GET /projects` (auth guard) | 3 | No token (401), malformed token (401), valid token (200 + data array) |

**Total: 9 integration tests** — all run against a live database with real bcrypt hashing and JWT signing. The `testTimeout` is set to 15 s to accommodate bcrypt cost on slower machines.

### Cleanup

The test suite automatically deletes all rows it creates (`test_*` email prefix) in an `afterAll` hook — tasks → projects → users, in foreign-key-safe order. No manual cleanup is needed between runs.

---

## API Reference

All endpoints prefixed with `/api/v1`.

### Auth (public)

| Method | Path | Body | Response |
|---|---|---|---|
| POST | `/auth/register` | `{name, email, password}` | `{token, user}` 201 |
| POST | `/auth/login` | `{email, password}` | `{token, user}` 200 |

### Projects (Bearer token required)

| Method | Path | Notes |
|---|---|---|
| GET | `/projects` | Paginated: `?page=1&limit=20` |
| POST | `/projects` | Create a project |
| GET | `/projects/:id` | Project + tasks |
| PATCH | `/projects/:id` | Owner only |
| DELETE | `/projects/:id` | Owner only — 204 No Content |
| GET | `/projects/:id/stats` | `{byStatus, byAssignee}` |

### Tasks (Bearer token required)

| Method | Path | Notes |
|---|---|---|
| GET | `/projects/:id/tasks` | Filterable: `?status=&assignee=&page=1&limit=20` |
| POST | `/projects/:id/tasks` | Create a task |
| PATCH | `/tasks/:id` | Project owner or task creator only |
| DELETE | `/tasks/:id` | Project owner or task creator only |

**Example — login and fetch projects:**

```bash
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  | jq -r '.token')

curl http://localhost:8000/api/v1/projects?page=1&limit=10 \
  -H "Authorization: Bearer $TOKEN"
# → { "data": [...], "total": 1, "page": 1, "limit": 10 }
```

**Example — project stats:**

```bash
curl http://localhost:8000/api/v1/projects/<id>/stats \
  -H "Authorization: Bearer $TOKEN"
# → { "byStatus": { "todo": 2, "in_progress": 1, "done": 1 }, "byAssignee": [...] }
```

---

## Architecture Decisions

**Express + Prisma over heavier frameworks**
Express is explicit — no magic, easy to trace a request from route to response. Prisma gives type-safe DB access and a clean migration workflow without raw SQL.

**Flat MVC without a service layer**
At this scope, putting business logic directly in controllers keeps the codebase flat and navigable. A service layer becomes the right call at roughly 3× this size, when controller functions start sharing substantial logic.

**shadcn/ui over a traditional component library**
shadcn/ui is copy-paste primitives built on Radix UI (accessible by default) + Tailwind. You own every component — no version lock-in, no fighting the library's opinions.

**JWT in localStorage**
The spec explicitly allows "localStorage or equivalent." HttpOnly cookies would be more secure against XSS but require CSRF handling; for this scope localStorage is the specified approach. This is acknowledged as a tradeoff.

**Optimistic UI for task status changes**
Status updates feel instant — the UI updates immediately and reverts with an error toast if the API call fails. This keeps interactions snappy without sacrificing correctness.

**App/index split for testability**
`src/app.ts` creates the Express app; `src/index.ts` binds the HTTP server. Vitest + Supertest can import the app without occupying a port.

---

## What I Would Do With More Time

### Teams, Roles, and Scoped Access (Data Model Improvement)
The biggest structural gap in the current design is that visibility is implicit — any authenticated user can see any project. A proper multi-tenant model would look like this:

```
User ──< TeamMember >── Team ──< Project ──< Task
                          │
                     (role: ADMIN | MEMBER)
```

- A new `Team` model with a `TeamMember` join table carrying a `role` enum (`ADMIN` | `MEMBER`)
- An `ADMIN` can create the team, invite users, and remove members
- Projects and tasks belong to a team, not directly to a user — so all access checks become `isMemberOf(team)` rather than `isOwner(project)`
- New indexes on `TeamMember(teamId, userId)` and `Project(teamId)` to keep those membership checks fast
- The auth middleware would be extended to resolve the active team from the request (header or path segment) and attach it to `req.team` alongside `req.user`

This would make the permission model explicit, auditable, and scalable — rather than the current implicit "you see everything" approach.

### State Management
The current context + hooks approach works well at this scale. With more users and real-time requirements, the next step would be **Zustand** for lightweight global state (simpler than Redux, no boilerplate) or **Redux Toolkit**.

### Real-time Updates
WebSocket or Server-Sent Events so task changes made by one user appear live for others viewing the same project — without a page refresh.

### Auth Hardening
- Refresh token rotation: short-lived access tokens (15 min) + long-lived refresh tokens in HttpOnly cookies
- Rate limiting on auth endpoints (`express-rate-limit`) to block brute-force attempts

### Notifications
Task assignment emails via a background queue (BullMQ + SMTP/SendGrid).

### Drag-and-drop Reordering
Tasks currently move between columns but can't be reordered within a column. Adding an `order` field to `Task` and a `PATCH /tasks/:id/reorder` endpoint would enable this.

### Test Coverage
Current tests cover auth only. Project CRUD, task CRUD, authorization edge cases (non-owner deletes, cross-project access), and pagination boundary conditions are the next areas to cover.
