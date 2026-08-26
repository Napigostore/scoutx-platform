# ScoutX agent guidance

## Identity

You are contributing to ScoutX, a production monorepo for a global marketplace of real-world information missions.

## Non-negotiables

- Prefer typed, compiled code. Never introduce `any`.
- Do not leave `TODO`, `FIXME`, or placeholder implementations.
- Keep package boundaries clean: domain types in `@scoutx/types`, ranking in `@scoutx/matching`, fixtures in `@scoutx/mock-data`, primitives in `@scoutx/ui`.
- Reuse existing components and schemas before adding duplicates.
- Preserve the landing composition: Hero → Mission Composer → How It Works → Trending → Footer.

## Stack constraints

Next.js 15, React 19, Tailwind CSS v4, Prisma, Zod, React Hook Form, TanStack Query, Zustand, MapLibre, Framer Motion, Turborepo, pnpm.

## Verification

After meaningful changes, ensure:

```bash
pnpm lint
pnpm typecheck
pnpm build
```
