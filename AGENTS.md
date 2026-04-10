# CLAUDE.md — TaskFlow Project Reference

> This file is the single source of truth for any AI agent (Claude Code, Copilot, etc.) working on this codebase. Read this before touching any file.

---

## Project Summary

**TaskFlow** is a full-stack task management system. Users should be able to register, log in, create projects, add tasks, and assign tasks to themselves or others.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 LTS, ES modules (`"type": "module"` in package.json) |
| Language | TypeScript for both backend and frontend |
| Backend Framework | Express 4.x |
| Database | PostgreSQL 16 |
| ORM | Prisma (for query building ONLY — migrations are handled by `prisma migrate`) |
| Auth | JWT (`jsonwebtoken`) + `bcryptjs` (cost ≥ 12) |
| Validation | Joi |
| Frontend Framework | React 18 + TypeScript + Vite |
| Component Library | shadcn/ui (Radix primitives + Tailwind CSS) |
| Routing | React Router v6 |
| State Management | React Context + hooks (no Redux) |
| HTTP Client | Axios |
| Containerization | Docker + docker-compose |

---

## Repo Structure

```
taskflow/
├── CLAUDE.md                  ← YOU ARE HERE
├── IMPLEMENTATION_PLAN.md     ← Step-by-step build plan
├── docker-compose.yml         ← Orchestrates db + backend + frontend
├── .env.example               ← All env vars with defaults
├── .gitignore
├── README.md                  ← Final submission README (written last)
│
├── backend/
│   ├── Dockerfile             ← Multi-stage build (builder + runtime)
│   ├── package.json           ← "type": "module"
│   ├── tsconfig.json
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/        ← Prisma migrate output (UP + DOWN via prisma migrate)
│   ├── scripts/
│   │   ├── seed.ts            ← Creates test user + project + 3 tasks
│   │   └── migrate-and-start.sh  ← Runs migrations then starts server
│   └── src/
│       ├── index.ts           ← Express app entry point
│       ├── config/
│       │   ├── database.ts    ← Singleton PrismaClient
│       │   └── env.ts         ← Env var validation & export
│       ├── routes/
│       │   ├── index.ts       ← Mounts all route groups under /api/v1
│       │   ├── auth.routes.ts
│       │   ├── project.routes.ts
│       │   └── task.routes.ts
│       ├── controllers/
│       │   ├── auth.controller.ts
│       │   ├── project.controller.ts
│       │   └── task.controller.ts
│       ├── middlewares/
│       │   ├── auth.middleware.ts       ← JWT verification, attaches req.user
│       │   └── errorHandler.middleware.ts ← Global async error handler
│       ├── validations/
│       │   ├── auth.validation.ts
│       │   ├── project.validation.ts
│       │   └── task.validation.ts
│       ├── helpers/
│       │   ├── jwt.helper.ts
│       │   ├── password.helper.ts
│       │   └── response.helper.ts       ← Standardized JSON responses
│       └── types/
│           └── express.d.ts             ← Extend Express Request with user
│
└── frontend/
    ├── Dockerfile             ← Multi-stage build (node build + nginx serve)
    ├── nginx.conf             ← SPA routing for React Router
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── tailwind.config.ts
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx            ← Router setup, auth provider
        ├── lib/
        │   ├── api.ts         ← Axios instance with interceptors
        │   └── types.ts       ← Shared TS interfaces (User, Project, Task)
        ├── context/
        │   └── AuthContext.tsx ← Auth state, login/logout/register, token persistence
        ├── hooks/
        │   ├── useProjects.ts
        │   └── useTasks.ts
        ├── components/
        │   ├── ui/            ← shadcn/ui primitives
        │   ├── Navbar.tsx
        │   ├── ProtectedRoute.tsx
        │   ├── ProjectCard.tsx
        │   ├── TaskCard.tsx
        │   ├── TaskModal.tsx  ← Create/edit task modal
        │   ├── ProjectModal.tsx
        │   ├── StatusBadge.tsx
        │   ├── PriorityBadge.tsx
        │   ├── EmptyState.tsx
        │   └── LoadingSpinner.tsx
        └── pages/
            ├── LoginPage.tsx
            ├── RegisterPage.tsx
            ├── ProjectsPage.tsx
            └── ProjectDetailPage.tsx
```

---

## Architecture Rules

### Backend — Layered MVC + Service Pattern

Every request flows through: **Route → Middleware → Controller → (Validation → DB via Prisma) → Response**

1. **Routes** (`/routes`): Define HTTP method + path, attach middleware, call controller. No business logic.
2. **Middlewares** (`/middlewares`): Auth verification, error handling. Thin and reusable.
3. **Controllers** (`/controllers`): Validate input (Joi), check authorization, perform DB operations via Prisma, return response. Controllers are the "service layer" — we don't need a separate service folder for this project's scope.
4. **Validations** (`/validations`): Joi schemas exported as objects. Called inside controllers via a validate helper.
5. **Helpers** (`/helpers`): Pure utility functions — JWT sign/verify, password hash/compare, response formatting.
6. **Config** (`/config`): Singleton PrismaClient, env var loading.

### Frontend — Component-Driven with Context

1. **Pages** map 1:1 with routes. Each page owns its data fetching.
2. **Components** are presentational where possible. Business logic lives in hooks/context.
3. **AuthContext** wraps the app, provides `user`, `token`, `login()`, `logout()`, `register()`.
4. **Axios instance** in `lib/api.ts` automatically attaches Bearer token from localStorage.
5. **Optimistic UI**: Task status changes update local state immediately, revert on API error.

---

## API Routes

All endpoints are prefixed with `/api/v1`.

### Auth (Public)
| Method | Path | Handler |
|---|---|---|
| POST | `/api/v1/auth/register` | `authController.register` |
| POST | `/api/v1/auth/login` | `authController.login` |

### Projects (Protected)
| Method | Path | Handler | Authorization |
|---|---|---|---|
| GET | `/api/v1/projects` | `projectController.list` | Any authenticated user |
| POST | `/api/v1/projects` | `projectController.create` | Any authenticated user |
| GET | `/api/v1/projects/:id` | `projectController.getById` | Any authenticated user |
| PATCH | `/api/v1/projects/:id` | `projectController.update` | Owner only |
| DELETE | `/api/v1/projects/:id` | `projectController.delete` | Owner only |

### Tasks (Protected)
| Method | Path | Handler | Authorization |
|---|---|---|---|
| GET | `/api/v1/projects/:id/tasks` | `taskController.list` | Any authenticated user |
| POST | `/api/v1/projects/:id/tasks` | `taskController.create` | Any authenticated user |
| PATCH | `/api/v1/tasks/:id` | `taskController.update` | Any authenticated user |
| DELETE | `/api/v1/tasks/:id` | `taskController.delete` | Project owner or task creator |

---

## HTTP Response Conventions

### Success
```json
// Single resource
{ "id": "uuid", "name": "...", ... }

// Collection
{ "projects": [...] }
{ "tasks": [...] }
```

### Errors
```json
// 400 Validation
{ "error": "validation failed", "fields": { "email": "is required" } }

// 401 Unauthenticated
{ "error": "unauthorized" }

// 403 Forbidden
{ "error": "forbidden" }

// 404 Not found
{ "error": "not found" }

// 500 Internal
{ "error": "internal server error" }
```

---

## Environment Variables

All env vars live in `.env` at the repo root. `.env.example` has safe defaults.

```env
# Database
POSTGRES_USER=taskflow
POSTGRES_PASSWORD=taskflow_secret
POSTGRES_DB=taskflow
DB_PORT=5432

# Backend
DATABASE_URL=postgresql://taskflow:taskflow_secret@db:5432/taskflow?schema=public
ACCESS_SECRET_TOKEN=change_me_in_production_this_must_be_at_least_32_chars
PORT=8000
NODE_ENV=production
BCRYPT_ROUNDS=12

# Frontend
VITE_API_URL=http://localhost:8000/api/v1

# Docker exposed ports
API_PORT=8000
FRONTEND_PORT=3000
```

---

## Seed Data

The seed script (`backend/scripts/seed.ts`) must create:

| Entity | Details |
|---|---|
| User | `test@example.com` / `password123` / name: "Test User" |
| Project | "Website Redesign", description: "Q2 redesign project", owned by test user |
| Task 1 | "Design homepage", status: `todo`, priority: `high`, assigned to test user, due 2026-04-20 |
| Task 2 | "Implement auth flow", status: `in_progress`, priority: `medium`, unassigned |
| Task 3 | "Write API documentation", status: `done`, priority: `low`, assigned to test user |

---

## Logging

Use `pino` (structured JSON logger) via `pino-http` middleware for Express.

---

## Docker Requirements

### Backend Dockerfile — Multi-stage
```
Stage 1 (builder): node:20-alpine, install deps, compile TS, generate Prisma client
Stage 2 (runtime): node:20-alpine, copy compiled JS + node_modules + prisma, run migrate-and-start.sh
```

### Frontend Dockerfile — Multi-stage
```
Stage 1 (builder): node:20-alpine, install deps, build Vite
Stage 2 (runtime): nginx:alpine, copy dist + nginx.conf
```

### Startup Order
1. PostgreSQL starts, healthcheck passes
2. Backend runs `prisma migrate deploy` then `prisma db seed` then starts Express
3. Frontend serves static files via nginx, proxies `/api` to backend (NOT needed — frontend calls backend directly via exposed port)

---

## Code Style Rules

- Use `const` over `let` wherever possible
- Async/await everywhere, no raw `.then()` chains
- No `any` type — use proper interfaces
- Controller functions: validate → authorize → execute → respond
- One route file per resource
- Named exports, no default exports (except React pages if needed by lazy loading)
- Error messages: lowercase
- Use `import type` for type-only imports in TypeScript

---

## Testing Notes (Bonus)

If implementing tests, use:
- **Backend**: Vitest + Supertest for integration tests
- **Frontend**: Vitest + React Testing Library

Minimum 3 integration tests for auth endpoints (register, login, protected route access).

---

## What NOT To Do

- Do NOT use `prisma db push` — use `prisma migrate dev` for migrations
- Do NOT store tokens in cookies — use localStorage for now
- Do NOT add a separate service layer — controllers handle business logic for this project size
- Do NOT add GraphQL, tRPC, or anything not in the spec
- Do NOT use `nodemon` in production Docker — use `node` directly
- Do NOT skip error handling or empty states in the frontend
