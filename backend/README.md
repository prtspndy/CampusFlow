# CampusFlow Backend Service 🛠️

> **Core API & Infrastructure Service** — Built with Express, TypeScript, Prisma 6, Neon PostgreSQL, Helmet, Zod, and Vitest.

---

## 🏗️ Architecture & Philosophy

The backend is built as a **modular monolith** optimized for hackathon agility, rapid team iteration, and rock-solid demonstration reliability:

```text
backend/
├── src/
│   ├── app.ts                  # Express application factory & middleware pipeline
│   ├── server.ts               # Server bootstrap, port binding & graceful shutdown
│   ├── config/
│   │   └── env.ts              # Zod environment validation & typed configuration
│   ├── lib/
│   │   └── prisma.ts           # Singleton Prisma Client (hot-reload safe)
│   ├── routes/
│   │   ├── index.ts            # Centralized API router & API info endpoint
│   │   └── health.routes.ts    # Liveness & readiness probes
│   ├── middleware/
│   │   ├── error.middleware.ts # Standardized error envelope & exception sanitization
│   │   └── not-found.middleware.ts # 404 handler for unmatched routes
│   ├── utils/
│   │   ├── async-handler.ts    # Express async/await controller wrapper
│   │   ├── errors.ts           # Structured application error classes
│   │   └── response.ts         # Standard success response helper
│   ├── types/
│   │   └── express.d.ts        # Express Request extensions (correlation ID)
│   └── docs/
│       └── swagger.ts          # OpenAPI 3.0 specification & Swagger UI
├── prisma/
│   ├── schema.prisma           # Prisma PostgreSQL schema (Neon-ready)
│   └── migrations/             # Versioned schema migrations
├── tests/
│   └── health.test.ts          # Vitest + Supertest integration tests
├── .env.example                # Environment variables template
├── eslint.config.js            # Flat ESLint configuration
├── tsconfig.json               # Strict TypeScript configuration
└── vitest.config.ts            # Vitest runner configuration
```

---

## 📋 Prerequisites

- **Node.js**: v20.x or v22.x/v24.x LTS (`node -v`)
- **npm**: v10.x or v11.x (`npm -v` / `npm.cmd -v` on Windows)
- **PostgreSQL**: Hosted on [Neon](https://neon.tech) (Serverless PostgreSQL)

---

## ⚡ Quick Setup Guide

### 1. Install Dependencies
```bash
# Navigate to the backend directory
cd backend

# Install production and development dependencies
npm install
```
*(On Windows PowerShell, use `npm.cmd install` if execution policy restricts PowerShell scripts).*

### 2. Configure Environment Variables
Copy the template to `.env`:
```bash
cp .env.example .env
```
> ⚠️ **CRITICAL SECURITY RULE**: The `.env` file contains environment secrets and must **NEVER** be committed to Git. `.gitignore` is already preconfigured to block it.

Open `.env` and fill in your variables:

| Variable | Description | Default | Required? |
|---|---|---|---|
| `NODE_ENV` | Environment mode (`development` / `production` / `test`) | `development` | No |
| `PORT` | Local server port | `5000` | No |
| `API_PREFIX` | Base route prefix for all endpoints | `/api` | No |
| `FRONTEND_URL` | Allowed frontend origins (comma-separated) | `http://localhost:5173` | Yes |
| `DATABASE_URL` | Neon pooled connection string | — | For DB queries |
| `DIRECT_URL` | Neon direct connection string (unpooled) | — | For Prisma migrations |

---

## 🐘 Neon PostgreSQL Configuration

Neon provides two distinct connection strings in its dashboard:

1. **Pooled Connection String (`DATABASE_URL`)**:
   - Ends with `-pooler.region.neon.tech` and includes `?sslmode=require`.
   - Used by the running Express application and Prisma Client to prevent connection pool exhaustion in serverless or multi-instance environments.
2. **Direct Connection String (`DIRECT_URL`)**:
   - Points directly to the compute endpoint without pgBouncer.
   - Required by Prisma CLI for `prisma migrate` and schema changes, because migration locks and advisory functions are incompatible with transaction poolers.

Example `.env` snippet:
```dotenv
DATABASE_URL="postgresql://neondb_owner:npg_xxx@ep-cool-fog-123456-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://neondb_owner:npg_xxx@ep-cool-fog-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

---

## 🔄 Prisma Migration & Generation Workflow

```bash
# 1. Validate the Prisma schema syntax
npm run db:validate

# 2. Generate Prisma Client TypeScript types (after any schema changes)
npm run db:generate

# 3. Create and apply a new migration (requires DIRECT_URL)
npm run db:migrate

# 4. Open Prisma Studio to browse database records visually
npm run db:studio
```

---

## 🚀 Running the Application

```bash
# Start development server with live reload (tsx)
npm run dev

# Build production bundle
npm run build

# Start production server
npm run start
```

Once running:
- **API Base**: `http://localhost:5000/api`
- **Interactive Swagger Docs**: `http://localhost:5000/api/docs`
- **Liveness Probe**: `http://localhost:5000/api/health`
- **Readiness Probe**: `http://localhost:5000/api/health/ready`

---

## 🧪 Testing & Quality Gates

Every developer must verify their code against quality gates before submitting pull requests:

```bash
# Run Vitest automated test suite with Supertest
npm run test

# Run TypeScript strict type checking (zero compiler errors required)
npm run typecheck

# Run ESLint checks
npm run lint

# Check code formatting with Prettier
npm run format:check

# Format code automatically
npm run format
```

---

## 📡 API Conventions & Response Contracts

See [docs/API_CONTRACT.md](../docs/API_CONTRACT.md) for full details.

### Success Envelope
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

### Error Envelope
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable sanitized message",
    "details": []
  }
}
```

---

## 🛠️ Common Troubleshooting

### 1. `DATABASE_URL is missing or Neon is unreachable`
- The server boots cleanly even if `DATABASE_URL` is omitted.
- `/api/health` will return `200 OK`.
- `/api/health/ready` will return `503 Service Unavailable`.
- To enable readiness, paste valid Neon connection strings into `.env`.

### 2. `PowerShell: execution of scripts is disabled on this system`
- Run `npm.cmd` and `npx.cmd` instead of `npm` and `npx` in Windows PowerShell.

### 3. `CORS origin not allowed`
- Add your frontend origin (e.g. `http://localhost:5173`) to `FRONTEND_URL` in `.env`.
- Multiple origins can be comma-separated: `http://localhost:5173,http://localhost:3000`.
