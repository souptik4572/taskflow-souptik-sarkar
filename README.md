# TaskFlow

A full-stack task management app. Register, log in, create projects, add tasks, assign them to team members, and manage work across a list or Kanban board view.

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
| Alternate | testAlternate@gmail.com | password123 |

Pre-seeded with one project ("Website Redesign") and four tasks spread across different statuses. The alternate user is assigned to the "Set up CI/CD pipeline" task.

---

## Running Tests

```bash
cd backend
npm test
```

9 integration tests covering:
- `POST /auth/register` — success, duplicate email, missing fields
- `POST /auth/login` — success, wrong password, unknown email
- `GET /projects` — 401 without token, 401 with bad token, 200 with valid token

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
| DELETE | `/projects/:id` | Owner only, returns 204 |
| GET | `/projects/:id/stats` | `{byStatus, byAssignee}` |

### Tasks (Bearer token required)

| Method | Path | Notes |
|---|---|---|
| GET | `/projects/:id/tasks` | Filterable: `?status=&assignee=&page=1&limit=20` |
| POST | `/projects/:id/tasks` | Create a task |
| PATCH | `/tasks/:id` | Update status, priority, assignee, etc. |
| DELETE | `/tasks/:id` | Project owner or task creator only, returns 204 |

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

## What I'd Do With More Time

### State Management
The current context + hooks approach works well at this scale. With more users and real-time requirements, the next step would be **Zustand** for lightweight global state (simpler than Redux, no boilerplate) or **Redux Toolkit**

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
