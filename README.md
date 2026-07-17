# ScoutX

[![CI Pipeline](https://github.com/scoutx/scoutx-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/scoutx/scoutx-platform/actions/workflows/ci.yml)
[![Security Scan](https://github.com/scoutx/scoutx-platform/actions/workflows/security.yml/badge.svg)](https://github.com/scoutx/scoutx-platform/actions/workflows/security.yml)
[![Release Pipeline](https://github.com/scoutx/scoutx-platform/actions/workflows/release.yml/badge.svg)](https://github.com/scoutx/scoutx-platform/actions/workflows/release.yml)

A global marketplace for real-world information discovery.

ScoutX connects people who need on-the-ground answers with scouts who can observe, verify, and deliver real-world information — from street conditions and venue availability to local events and physical presence checks.

## Stack

| Layer    | Technology                                    |
| -------- | --------------------------------------------- |
| App      | Next.js 15, React 19, TypeScript              |
| Styling  | Tailwind CSS v4, shadcn/ui, Framer Motion     |
| State    | Zustand, TanStack Query, React Hook Form, Zod |
| Maps     | MapLibre GL                                   |
| Data     | Prisma, PostgreSQL                            |
| Monorepo | Turborepo, pnpm                               |
| Quality  | ESLint, Prettier, Husky, GitHub Actions       |

## Repository structure

```
apps/
  web/                 Next.js application
packages/
  ui/                  Shared UI primitives (shadcn/ui)
  types/               Shared TypeScript types and Zod schemas
  matching/            Scout–mission matching engine
  mock-data/           Deterministic seed and demo data
config/
  typescript/          Shared TypeScript configs
docs/                  Architecture and product docs
.ai/                   Agent and coding guidance
.github/               CI workflows
```

## Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL 16+ (for database features)

## Getting started

```bash
pnpm install
cp apps/web/.env.example apps/web/.env
pnpm db:generate
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command            | Description                        |
| ------------------ | ---------------------------------- |
| `pnpm dev`         | Start all apps in development mode |
| `pnpm build`       | Build all packages and apps        |
| `pnpm lint`        | Lint the monorepo                  |
| `pnpm typecheck`   | Run TypeScript checks              |
| `pnpm format`      | Format with Prettier               |
| `pnpm db:generate` | Generate Prisma client             |
| `pnpm db:push`     | Push schema to the database        |
| `pnpm db:migrate`  | Run Prisma migrations              |
| `pnpm db:studio`   | Open Prisma Studio                 |

## Packages

### `@scoutx/types`

Shared domain types and Zod schemas for users, missions, scouts, locations, and matching.

### `@scoutx/ui`

Reusable UI components built with Radix primitives and Tailwind CSS v4.

### `@scoutx/matching`

Deterministic matching engine that ranks scouts for a mission by proximity, reliability, category fit, and availability.

### `@scoutx/mock-data`

Typed fixtures used by the landing page, demos, and local development.

## License

MIT — see [LICENSE](./LICENSE).


## Docker & Deployment

### Build Docker Image
```bash
docker build -t scoutx-platform:local .
```

### Chạy bằng Docker Compose
```bash
docker compose up -d
```

### Health Endpoints
- Liveness: `http://localhost:3000/api/health/live`
- Readiness: `http://localhost:3000/api/health/ready`


## Kubernetes Deployment

### Render Manifests bằng Kustomize
- Staging:
  ```bash
  kubectl kustomize deploy/kubernetes/overlays/staging
  ```
- Production:
  ```bash
  kubectl kustomize deploy/kubernetes/overlays/production
  ```

### Triển khai lên Cluster
- Staging:
  ```bash
  kubectl apply -k deploy/kubernetes/overlays/staging
  ```
- Production:
  ```bash
  kubectl apply -k deploy/kubernetes/overlays/production
  ```
