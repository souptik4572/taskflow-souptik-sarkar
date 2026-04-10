# TaskFlow

A full-stack task management system. Users register, log in, create projects, add tasks, assign tasks, and manage work across a list or Kanban board view.

---

## Overview

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

## Running Locally

**Prerequisites:** Docker + Docker Compose installed. No other tools required.

```bash
git clone <repo>
cd taskflow-souptik-sarkar

# Copy env config (defaults work out of the box)
cp .env.example .env

# Start everything — migrations and seed run automatically
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api/v1
- Health check: http://localhost:8000/health

### Migrations

Migrations run automatically on backend startup via `scripts/migrate-and-start.sh`:

1. `prisma migrate deploy` — applies all pending migrations
2. `prisma db seed` — creates seed data (idempotent — safe to re-run)
3. `node dist/index.js` — starts the Express server

**Zero manual steps required.**

---

## Test Credentials

```
Email:    test@example.com
Password: password123
```

Pre-seeded with one project ("Website Redesign") and three tasks in different statuses.

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

| Method | Path | Query Params | Auth | Response |
|---|---|---|---|---|
| GET | `/projects` | `?page=1&limit=20` | Any user | `{data, total, page, limit}` |
| POST | `/projects` | — | Any user | Project object 201 |
| GET | `/projects/:id` | — | Any user | Project + tasks |
| PATCH | `/projects/:id` | — | Owner only | Updated project |
| DELETE | `/projects/:id` | — | Owner only | 204 |
| GET | `/projects/:id/stats` | — | Any user | `{byStatus, byAssignee}` |

### Tasks (Bearer token required)

| Method | Path | Query Params | Auth | Response |
|---|---|---|---|---|
| GET | `/projects/:id/tasks` | `?status=&assignee=&page=1&limit=20` | Any user | `{data, total, page, limit}` |
| POST | `/projects/:id/tasks` | — | Any user | Task object 201 |
| PATCH | `/tasks/:id` | — | Any user | Updated task |
| DELETE | `/tasks/:id` | — | Project owner or task creator | 204 |

**Example login:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

**Example paginated projects:**
```bash
curl http://localhost:8000/api/v1/projects?page=1&limit=10 \
  -H "Authorization: Bearer <token>"
# → { "data": [...], "total": 5, "page": 1, "limit": 10 }
```

**Example project stats:**
```bash
curl http://localhost:8000/api/v1/projects/<id>/stats \
  -H "Authorization: Bearer <token>"
# → { "byStatus": { "todo": 1, "in_progress": 1, "done": 1 }, "byAssignee": [...] }
```

---

## Architecture Decisions

**Why Express + Prisma?** Express is lightweight and explicit — no magic, easy to reason about. Prisma gives type-safe DB access with a clean migration workflow, avoiding raw SQL while still producing readable queries.

**Layered MVC without a separate service layer:** At this project's scope, putting business logic in controllers keeps the codebase flat and navigable. A service layer would be the right call at 3× this size.

**Why shadcn/ui?** Not a component library you install and fight — it's copy-paste primitives built on Radix (accessible by default) + Tailwind. You own the code, style it freely, no version lock-in.

**JWT in localStorage:** The assignment explicitly says "localStorage or equivalent." HttpOnly cookies would be more secure against XSS, but they require CSRF handling; for this scope localStorage is the specified approach.

**Optimistic UI for task status:** Status changes feel instant. On API failure the state reverts with an error. This keeps the UI snappy without sacrificing correctness.

**App/Index split for testability:** `src/app.ts` creates the Express app; `src/index.ts` creates the HTTP server. This lets Vitest + Supertest import the app without binding a port.

**Tradeoffs made:**
- No refresh tokens — 24h JWT expiry is a balance between security and UX
- Dark mode applies the `dark` class on `<html>` via Tailwind's class strategy; persists in localStorage and respects `prefers-color-scheme` on first visit
- Kanban board uses `@dnd-kit` with pointer sensor (8px drag threshold) to avoid accidental drags on click

---

## What I'd Do With More Time

1. **Real-time updates** — WebSocket or SSE for live task changes across tabs
2. **Email notifications** — task assignment emails via a queue (BullMQ + SMTP)
3. **Rate limiting** — `express-rate-limit` on auth endpoints to prevent brute-force
4. **Refresh token rotation** — short-lived access tokens + long-lived refresh tokens in HttpOnly cookies
5. **Drag-and-drop ordering within columns** — tasks currently only move between columns, not reorder within a column
6. **More test coverage** — project CRUD, task CRUD, authorization edge cases
