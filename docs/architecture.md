# ScoutX Architecture

## Overview

ScoutX is a Turborepo monorepo that ships a Next.js marketplace for real-world information missions. Shared domain logic lives in packages so the web app, matching engine, and future clients stay aligned.

## Runtime flow

1. A requester drafts a mission (title, category, location, budget, urgency).
2. The matching engine ranks scouts by distance, reliability, category fit, tag overlap, availability, and urgency alignment.
3. An assigned scout submits timestamped, geotagged evidence.
4. Verification updates reliability scores and closes the mission.

## Package boundaries

| Package             | Responsibility                                     |
| ------------------- | -------------------------------------------------- |
| `@scoutx/types`     | Zod schemas and TypeScript domain types            |
| `@scoutx/matching`  | Deterministic scout ranking                        |
| `@scoutx/mock-data` | Fixtures for landing, demos, and local development |
| `@scoutx/ui`        | Shared UI primitives                               |
| `@scoutx/web`       | Next.js App Router product surface + Prisma        |

## Data

PostgreSQL is the system of record. Prisma models mirror the shared Zod schemas for users, locations, scout profiles, missions, and submissions.

## Frontend

- Server Components render the landing shell and trending mission cards.
- Client Components own interactive surfaces: MapLibre map, mission composer form, Framer Motion reveals, and TanStack Query match previews.
- Zustand stores the in-progress composer draft across focus changes.
