# TaskFlow

A full-stack task management system. Users register, log in, create projects, add tasks, and assign tasks to themselves or others.

---

## Overview

| Layer | Technology |
|---|---|
| Backend | Node.js 20, Express 4, TypeScript (strict), Prisma ORM, PostgreSQL 16 |
| Auth | JWT (24h expiry) + bcryptjs (cost 12) |
| Validation | Joi |
| Logging | pino + pino-http (structured JSON) |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, React Router v6 |
| HTTP Client | Axios (with auth interceptors) |
| Containers | Docker + docker-compose (three services: db, backend, frontend) |

---

## Running Locally

**Prerequisites:** Docker + Docker Compose (no other tools needed)

```bash
git clone <repo>
cd taskflow-souptik-sarkar

# Copy env config (defaults work out of the box)
cp .env.example .env

# Start everything
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

## API Reference

All endpoints prefixed with `/api/v1`.

### Auth (public)

| Method | Path | Body | Response |
|---|---|---|---|
| POST | `/auth/register` | `{name, email, password}` | `{token, user}` 201 |
| POST | `/auth/login` | `{email, password}` | `{token, user}` 200 |

### Projects (Bearer token required)

| Method | Path | Auth | Response |
|---|---|---|---|
| GET | `/projects` | Any user | `{projects: [...]}` |
| POST | `/projects` | Any user | Project object 201 |
| GET | `/projects/:id` | Any user | Project + tasks |
| PATCH | `/projects/:id` | Owner only | Updated project |
| DELETE | `/projects/:id` | Owner only | 204 |

### Tasks (Bearer token required)

| Method | Path | Auth | Response |
|---|---|---|---|
| GET | `/projects/:id/tasks` | Any user | `{tasks: [...]}` |
| POST | `/projects/:id/tasks` | Any user | Task object 201 |
| PATCH | `/tasks/:id` | Any user | Updated task |
| DELETE | `/tasks/:id` | Project owner or task creator | 204 |

**Query params for task list:** `?status=todo|in_progress|done&assignee=<uuid>`

**Example login:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

---

## Architecture Decisions

**Why Express + Prisma?** Express is lightweight and explicit — no magic, easy to reason about. Prisma gives type-safe DB access with a clean migration workflow, avoiding raw SQL while still producing readable queries.

**Layered MVC without a separate service layer:** At this project's scope, putting business logic in controllers keeps the codebase flat and navigable. A service layer would be the right call at 3x this size.

**Why shadcn/ui?** It's not a component library you install and fight — it's copy-paste primitives built on Radix (accessible by default) + Tailwind. You own the code, style it freely, no version lock-in.

**JWT in localStorage:** The assignment explicitly says "localStorage or equivalent." HttpOnly cookies would be strictly more secure against XSS, but they require CSRF handling; for this scope localStorage is the specified approach.

**Optimistic UI for task status:** Status changes feel instant. On API failure the state reverts with an error. This keeps the UI snappy without sacrificing correctness.

**Tradeoffs made:**
- No refresh tokens — 24h JWT expiry is a balance between security and UX for an assignment
- No pagination — the list endpoints return all items; adding `?page&limit` would be straightforward
- No test suite in the base implementation — the architecture is designed to make Vitest + Supertest integration tests easy to add

---

## What I'd Do With More Time

1. **Pagination** on `/projects` and `/tasks` endpoints (the query schema already accepts page/limit)
2. **Integration tests** — 3+ Vitest + Supertest tests for auth endpoints
3. **Refresh token rotation** — short-lived access tokens + long-lived refresh tokens in HttpOnly cookies
4. **Real-time updates** — WebSocket or SSE for live task status changes across tabs
5. **Kanban board view** — drag-and-drop status columns using `@dnd-kit/core`
6. **Email notifications** — task assignment emails via a queue (e.g., BullMQ + SMTP)
7. **Rate limiting** — `express-rate-limit` on auth endpoints to prevent brute-force
