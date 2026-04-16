# AGENTS.md — MedFlow Telemedicine Platform

Monorepo: `backend/` (NestJS + Prisma) and `frontend/` (Next.js 15 App Router).

## Build / Dev / Lint / Test Commands

### Backend (from `backend/` directory)

| Action | Command |
|--------|---------|
| Install deps | `pnpm install` |
| Dev server | `pnpm run start:dev` (port 3001) |
| Build | `pnpm run build` |
| Lint (with fix) | `pnpm run lint` |
| Format | `pnpm run format` |
| Run all unit tests | `pnpm run test` |
| Run single test file | `pnpm run test -- --testPathPattern=users.service.spec` |
| Run tests in watch mode | `pnpm run test:watch` |
| Test coverage | `pnpm run test:cov` |
| E2E tests | `pnpm run test:e2e` |
| Prisma generate | `pnpm prisma generate` |
| Prisma push schema | `pnpm prisma db push` |
| Prisma seed | `pnpm prisma db seed` |

### Frontend (from `frontend/` directory)

| Action | Command |
|--------|---------|
| Install deps | `pnpm install` |
| Dev server | `pnpm dev` (port 3000) |
| Build | `pnpm build` |
| Lint | `pnpm lint` |

The frontend has no test runner configured. There is no `jest`, `vitest`, or `test` script in `package.json`.

### Infrastructure

| Action | Command |
|--------|---------|
| Start PostgreSQL | `docker compose up -d` (from repo root) |

## Project Architecture

```
.
├── backend/               # NestJS API
│   ├── prisma/
│   │   ├── schema.prisma  # Database schema (PostgreSQL, UUID PKs)
│   │   └── seed.ts        # Seed data
│   ├── src/
│   │   ├── main.ts        # Bootstrap, CORS, JWT_SECRET from env
│   │   ├── app.module.ts  # Root module
│   │   ├── core/security/  # Auth: JWT strategy, guards, decorators
│   │   ├── prisma/         # PrismaService (global module)
│   │   └── modules/       # Feature modules (one dir per domain)
│   └── test/               # E2E tests
├── frontend/               # Next.js 15 (App Router)
│   └── src/
│       ├── app/            # Routes (dashboard/*, login/, signup/)
│       ├── components/     # Shared UI components
│       ├── context/        # AuthContext (React Context)
│       ├── hooks/          # useSocket (Socket.IO)
│       └── lib/            # api.ts (centralized fetch client)
└── docker-compose.yml      # PostgreSQL
```

## Backend Conventions (NestJS)

### Module Structure

Every feature module lives in `src/modules/<module-name>/` with this trio:

```
module-name/
├── module-name.module.ts
├── module-name.controller.ts
└── module-name.service.ts
```

Additional files as needed: `*.gateway.ts` (WebSocket), `dto/` (request bodies).

### File Naming

- **kebab-case** for all files and directories: `lab-test-template.service.ts`, `jwt-auth.guard.ts`
- DTO files: `create-patient.dto.ts`, `login.dto.ts`

### Imports

- Relative paths only — no path aliases in the backend: `import { PrismaService } from '../../prisma/prisma.service'`
- External packages use bare specifiers: `@nestjs/common`, `@prisma/client`, `argon2`

### Controllers

```typescript
@Controller('route-prefix')
@UseGuards(JwtAuthGuard, RolesGuard)
export class XxxController {
  constructor(private readonly xxxService: XxxService) {}

  @Roles('ADMIN', 'DOCTOR')
  @Post()
  create(@Body() body: { name: string }, @CurrentUser() user: UserPayload) { ... }
}
```

- Guard order: `JwtAuthGuard, RolesGuard` on every controller (except `AuthController`)
- `@Roles(...)` decorator on methods that restrict access
- `@CurrentUser()` custom param decorator extracts `req.user`
- Public routes only in `AuthController` (login, signup)

### Services

```typescript
@Injectable()
export class XxxService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.client.xxx.findMany();  // NOTE: .client, NOT direct
  }
}
```

- Always inject `PrismaService` via constructor
- All methods are `async`
- Use `this.prisma.client.xxx` (not `this.prisma.xxx`) — the `.client` accessor applies the Prisma extension for field-level encryption
- Transactions: `this.prisma.client.$transaction(async (tx) => { ... })`

### Error Handling

Use NestJS built-in exception classes — no custom error classes:

- `throw new NotFoundException('message')`
- `throw new BadRequestException('message')`
- `throw new UnauthorizedException('message')`
- `throw new ConflictException('message')`

Do not wrap in try/catch in controllers; let errors propagate to NestJS global filter.

### Prisma / Database

- PostgreSQL with UUID primary keys
- Role enum: `ADMIN | DOCTOR | LAB_TECH | PHARMACIST | NURSE | PATIENT`
- PatientFlow state machine: `AWAITING_TRIAGE → AWAITING_DOCTOR → AWAITING_LAB → AWAITING_DOCTOR_REVIEW → AWAITING_PHARMACY → DISCHARGED`
- Sensitive fields (`ConsultationNote.notes`, `LabTest.resultData`) are encrypted at rest via Prisma client extension (AES-256-CBC)
- `PrismaModule` and `QueueModule` are `@Global()` — no need to import them in feature modules

### TypeScript Config

- Target: ES2023, module: nodenext
- `strictNullChecks`, `noImplicitAny`, `strictBindCallApply` enabled
- `@typescript-eslint/no-explicit-any` is OFF
- Prettier: single quotes, trailing commas

### Testing

- Test files: `*.spec.ts` (unit) in `src/`, `*.e2e-spec.ts` in `test/`
- Jest with ts-jest, test environment: node
- Run a single test: `pnpm run test -- --testPathPattern=<pattern>`
- Test root dir is `src`, match pattern: `.*\\.spec\\.ts$`

## Frontend Conventions (Next.js 15)

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

### App Router Structure

- Routes live in `src/app/` using Next.js App Router conventions (`page.tsx`, `layout.tsx`)
- Route segments: kebab-case URLs (`check-patients/`, `lab-test-templates/`)
- Dynamic routes: `[id]/` folders
- **Only `src/app/layout.tsx` is a Server Component** — everything else is `'use client'`

### Component Conventions

- One component per file, PascalCase filename matching component name
- All components use `export default function ComponentName`
- Shared components in `src/components/`
- Use `'use client'` directive at the top of all component files except the root layout

### Imports

- Cross-module imports use `@/` path alias: `import { useAuth } from '@/context/AuthContext'`
- Sibling imports use `./`: `import Sidebar from './Sidebar'`
- Type co-imports use `type` keyword: `import { getStaff, type StaffMember } from '@/lib/api'`

### Styling — Brutalist Minimalist Design System

This project uses a **custom design system**, NOT shadcn/ui and NOT standard Tailwind utilities.

- CSS custom properties defined in `globals.css` (`--bg`, `--text`, `--border`, `--accent`, etc.)
- Hand-written utility classes in `globals.css`: `.btn`, `.btn-primary`, `.btn-danger`, `.card`, `.data-table`, `.modal-overlay`, etc.
- Heavy use of inline `style={{}}` objects for layout, spacing, typography
- Tailwind is imported but only minimally used (mostly in `layout.tsx`)
- Design rules: `border-radius: 0 !important`, `transition: none !important`, monospace font (`Space Mono`) for UI
- Responsive breakpoints via injected `<style>` blocks with `@media` queries
- Do NOT add shadcn/ui components or standard Tailwind utility classes

### State Management

- **Auth**: React Context (`AuthContext`) — provides `user`, `token`, `login`, `logout`
- **Local state**: `useState` for form data, UI toggles, API responses
- **Real-time**: `useSocket` hook returns `lastUpdate` timestamp; pages re-fetch data in `useEffect` when it changes
- **Memoization**: `useCallback` for async fetchers, `useMemo` for derived data

### API Client (`src/lib/api.ts`)

- Centralized fetch wrapper: `fetchApi<T>(path, options)` handles auth headers, error parsing
- Custom `ApiError` class with `status` and `message`
- All API functions are async and return typed Promises
- Token stored in `localStorage`, attached as `Authorization: Bearer <token>`

### Typing Conventions

- `interface` for object shapes: `UserPayload`, `StaffMember`, `LoginResponse`
- Props suffix: `XxxProps` (e.g., `DashboardShellProps`)
- String union types instead of TS enums: `type Role = "ADMIN" | "DOCTOR" | ...`
- Record types for config maps: `Record<Role, string>`

### Error Handling in Components

```typescript
try {
  await someApiCall(...);
  setSuccessMsg('Operation succeeded');
} catch (err: unknown) {
  setError(err instanceof Error ? err.message : 'An unexpected error occurred');
} finally {
  setSubmitting(false);
}
```

- Always type catch as `unknown`, check with `instanceof Error`
- Always provide a human-readable fallback message
- Always reset loading state in `finally`

## Environment Variables

### Backend (`backend/.env`)
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — JWT signing key (defaults to hardcoded `"SUPER_SECRET_KEY"` if unset)
- `ENCRYPTION_KEY` — AES-256-CBC key for PII encryption (defaults to hardcoded value if unset)
- `PORT` — Server port (defaults to 3001)

### Frontend (`frontend/.env.local`)
- `NEXT_PUBLIC_API_URL` — Backend API URL (default: `http://localhost:3001`)

## Key Dependencies

- Backend: NestJS 11, Prisma 5, Socket.IO, Passport/JWT, Argon2
- Frontend: Next.js 16 (canary), React 19, Socket.IO Client, Tailwind CSS 4, Lucide icons