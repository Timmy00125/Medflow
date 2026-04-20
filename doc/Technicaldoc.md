# MedFlow — Telemedicine Platform Technical Documentation

> **Version:** 0.0.1
> **Last Updated:** 2026-04-20

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Technology Stack](#2-technology-stack)
3. [Architecture](#3-architecture)
4. [Project Structure](#4-project-structure)
5. [Database Design](#5-database-design)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [Patient Flow State Machine](#7-patient-flow-state-machine)
8. [Backend Modules — Detailed Reference](#8-backend-modules--detailed-reference)
   - [Users Module](#81-users-module)
   - [Queue Module](#82-queue-module)
   - [Consultation Module](#83-consultation-module)
   - [Laboratory Module](#84-laboratory-module)
   - [Pharmacy Module](#85-pharmacy-module)
   - [Drug Module](#86-drug-module)
   - [Lab Test Template Module](#87-lab-test-template-module)
   - [Vitals Module](#88-vitals-module)
9. [Frontend Architecture](#9-frontend-architecture)
   - [Routing & Pages](#91-routing--pages)
   - [Shared Components](#92-shared-components)
   - [State Management](#93-state-management)
   - [Real-Time Updates](#94-real-time-updates)
   - [API Client](#95-api-client)
   - [Design System](#96-design-system)
10. [Real-Time Communication (WebSocket)](#10-real-time-communication-websocket)
11. [Data Encryption & Security](#11-data-encryption--security)
12. [Role-Based Workflows](#12-role-based-workflows)
    - [ADMIN Workflow](#121-admin-workflow)
    - [NURSE Workflow](#122-nurse-workflow)
    - [DOCTOR Workflow](#123-doctor-workflow)
    - [LAB_TECH Workflow](#124-lab_tech-workflow)
    - [PHARMACIST Workflow](#125-pharmacist-workflow)
    - [PATIENT Workflow](#126-patient-workflow)
13. [Complete API Reference](#13-complete-api-reference)
14. [Environment Variables](#14-environment-variables)
15. [Seeding & Initial Data](#15-seeding--initial-data)
16. [Running the Application](#16-running-the-application)
17. [Known Observations & Limitations](#17-known-observations--limitations)

---

## 1. System Overview

MedFlow is a full-stack telemedicine platform that manages the complete patient journey through a healthcare facility — from triage/intake through doctor consultation, laboratory testing, pharmacy dispensing, and discharge. It is designed for use in clinics and hospitals where patients flow through multiple departments, and each department has staff with distinct roles and responsibilities.

The system provides:

- **Role-based access control** with six distinct roles (ADMIN, DOCTOR, NURSE, LAB_TECH, PHARMACIST, PATIENT)
- **Patient flow state machine** that tracks a patient's current department and transitions them through defined states
- **Real-time queue updates** via WebSocket so all connected clients see live queue changes
- **Field-level encryption** for sensitive medical data (consultation notes, lab test results) at rest in the database
- **Department-specific dashboards** for each role, with the right data and actions available at the right time

---

## 2. Technology Stack

### Backend

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | NestJS | 11.x |
| Language | TypeScript | 5.x |
| ORM | Prisma | 5.x |
| Database | PostgreSQL | 16 (Alpine via Docker) |
| Authentication | Passport + JWT (passport-jwt) | 4.0.1 |
| Password Hashing | Argon2 | 0.44.x |
| Real-Time | Socket.IO (NestJS WebSockets) | 4.8.x |
| Encryption | Node.js crypto (AES-256-CBC) | Built-in |
| Config | @nestjs/config | 4.x |
| Runtime | Node.js | ES2023 target |

### Frontend

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.2.1 (canary) |
| Language | TypeScript | 5.x |
| UI Library | React | 19.2.x |
| Styling | Tailwind CSS | 4.x (custom design system, NOT shadcn/ui) |
| Icons | Lucide React | 1.7.x |
| Real-Time | Socket.IO Client | 4.8.x |
| Font | Space Mono (Google Fonts) | Monospace |

### Infrastructure

| Service | Technology |
|---------|-----------|
| Database | PostgreSQL 16 Alpine (Docker) |
| Container Orchestration | Docker Compose |
| Development Server | NestJS `start:dev` (port 3001) |
| Frontend Dev Server | Next.js dev server (port 3000) |

---

## 3. Architecture

MedFlow follows a **monorepo** architecture with a clear separation between backend and frontend:

```
PROJECT_FULL/               ← Monorepo root
├── backend/                ← NestJS API (port 3001)
│   ├── prisma/             ← Database schema & seed
│   └── src/                ← Application source
│       ├── core/security/  ← Auth guards, JWT strategy, decorators
│       ├── prisma/         ← PrismaService with encryption extension
│       └── modules/        ← Feature modules (domain-driven)
├── frontend/               ← Next.js 15 App Router (port 3000)
│   └── src/
│       ├── app/            ← Page routes (file-based routing)
│       ├── components/     ← Shared UI components
│       ├── context/        ← React Context (Auth, Theme)
│       ├── hooks/          ← useSocket for real-time
│       └── lib/            ← Centralized API client
├── docker-compose.yml      ← PostgreSQL service definition
└── doc/                    ← Documentation
```

### Communication Pattern

```
┌─────────────┐    HTTP/REST (JSON)     ┌─────────────────┐
│   Frontend   │ ──────────────────────► │   Backend API    │
│  (Next.js)   │                         │   (NestJS)       │
│   Port 3000  │ ◄────────────────────── │   Port 3001     │
└──────┬───────┘    REST Responses        └────────┬────────┘
       │                                          │
       │         WebSocket (Socket.IO)             │
       │ ◄──────────────────────────────────────► │
       │         Real-time queue/patient updates    │
       │                                          │
       │                                          ▼
       │                                 ┌─────────────────┐
       │                                 │  PostgreSQL     │
       │                                 │  (Docker)       │
       │                                 │  Port 5432      │
       │                                 └─────────────────┘
```

- **REST**: All CRUD operations use standard HTTP request/response with JSON bodies.
- **WebSocket**: Socket.IO is used for real-time notifications. The server broadcasts `queueUpdate` globally and `patientUpdate-{patientId}` for specific patients whenever a queue state changes.
- **CORS**: The backend allows origins `http://localhost:3000` and `http://127.0.0.1:3000` with credentials.

---

## 4. Project Structure

### Backend (`backend/`)

```
backend/
├── prisma/
│   ├── schema.prisma          # Database models, enums, relations
│   └── seed.ts                # Admin user + default drugs/lab tests
├── src/
│   ├── main.ts                # Bootstrap, CORS, port config
│   ├── app.module.ts          # Root module importing all feature modules
│   ├── app.controller.ts      # Health check controller
│   ├── app.service.ts          # Health check service
│   ├── core/
│   │   └── security/
│   │       ├── current-user.decorator.ts  # @CurrentUser() param decorator
│   │       ├── jwt-auth.guard.ts           # JWT authentication guard
│   │       ├── jwt.strategy.ts             # Passport JWT strategy
│   │       ├── roles.decorator.ts          # @Roles() metadata decorator
│   │       └── roles.guard.ts              # Role-based authorization guard
│   ├── prisma/
│   │   ├── prisma.module.ts   # @Global Prisma module
│   │   └── prisma.service.ts  # PrismaService with encryption extension
│   └── modules/
│       ├── users/              # Auth + User management
│       │   ├── users.module.ts
│       │   ├── users.controller.ts
│       │   ├── auth.controller.ts
│       │   ├── users.service.ts
│       │   └── dto/
│       │       ├── login.dto.ts
│       │       ├── create-patient.dto.ts
│       │       └── create-staff.dto.ts
│       ├── queue/              # Patient queue & flow management
│       │   ├── queue.module.ts
│       │   ├── queue.controller.ts
│       │   ├── queue.service.ts
│       │   └── queue.gateway.ts   # WebSocket gateway
│       ├── consultation/       # Doctor consultation notes
│       │   ├── consultation.module.ts
│       │   ├── consultation.controller.ts
│       │   └── consultation.service.ts
│       ├── laboratory/         # Lab test management
│       │   ├── laboratory.module.ts
│       │   ├── laboratory.controller.ts
│       │   └── laboratory.service.ts
│       ├── pharmacy/           # Prescription dispensing + inventory
│       │   ├── pharmacy.module.ts
│       │   ├── pharmacy.controller.ts
│       │   └── pharmacy.service.ts
│       ├── drug/               # Drug catalog management
│       │   ├── drug.module.ts
│       │   ├── drug.controller.ts
│       │   └── drug.service.ts
│       ├── lab-test-template/  # Lab test template catalog
│       │   ├── lab-test-template.module.ts
│       │   ├── lab-test-template.controller.ts
│       │   └── lab-test-template.service.ts
│       └── vitals/             # Patient vitals recording
│           ├── vitals.module.ts
│           ├── vitals.controller.ts
│           └── vitals.service.ts
└── test/                       # E2E tests
```

### Frontend (`frontend/`)

```
frontend/src/
├── app/
│   ├── layout.tsx                           # Root layout (Server Component)
│   ├── globals.css                          # Brutalist design system
│   ├── page.tsx                             # / — Redirect router
│   ├── login/page.tsx                       # /login
│   ├── signup/page.tsx                      # /signup
│   └── dashboard/
│       ├── layout.tsx                       # Auth guard layout
│       ├── page.tsx                         # /dashboard — Role redirect
│       ├── check-patients/page.tsx          # /dashboard/check-patients
│       ├── history/page.tsx                # /dashboard/history
│       ├── nurse/page.tsx                  # /dashboard/nurse
│       ├── patient/page.tsx                # /dashboard/patient
│       ├── pharmacy/page.tsx               # /dashboard/pharmacy
│       ├── laboratory/page.tsx             # /dashboard/laboratory
│       ├── doctor/page.tsx                 # /dashboard/doctor
│       └── admin/
│           ├── page.tsx                     # /dashboard/admin
│           ├── patients/page.tsx           # Re-exports check-patients
│           ├── patients/[id]/page.tsx      # Patient detail
│           ├── pharmacy/page.tsx            # Admin pharmacy ledger
│           ├── laboratory/page.tsx          # Admin lab ledger
│           ├── nurses/page.tsx             # Nurse management
│           ├── nurses/[id]/page.tsx        # Nurse history
│           ├── doctors/page.tsx            # Doctor directory
│           └── doctors/[id]/page.tsx       # Doctor history
├── components/
│   ├── Sidebar.tsx            # Role-filtered navigation
│   ├── DashboardShell.tsx     # Layout wrapper (sidebar + header)
│   ├── QueueTable.tsx         # Reusable data table
│   ├── StatCard.tsx           # KPI metric display card
│   ├── StatusBadge.tsx        # Patient flow status badge
│   ├── GlassCard.tsx          # Content container card
│   └── DarkModeToggle.tsx     # Light/dark theme toggle
├── context/
│   ├── AuthContext.tsx         # Auth state, login/logout, role routing
│   └── ThemeContext.tsx        # Light/dark theme management
├── hooks/
│   └── useSocket.ts           # Socket.IO hook for real-time updates
└── lib/
    └── api.ts                 # Centralized fetch client + all API functions
```

---

## 5. Database Design

### ORM & Connection

- **ORM**: Prisma 5.x with `prisma-client-js` generator
- **Database**: PostgreSQL 16 Alpine (Docker)
- **Primary Keys**: All models use UUID (`@id @default(uuid())`)
- **Connection**: Configured via `DATABASE_URL` environment variable

### Enumerations

**Role** — User roles in the system:
| Value | Description |
|-------|------------|
| `ADMIN` | System administrator — full access to all features |
| `DOCTOR` | Physician — consultation, prescriptions, lab orders |
| `NURSE` | Nurse — triage, vitals, doctor assignment, discharge |
| `LAB_TECH` | Laboratory technician — process lab tests |
| `PHARMACIST` | Pharmacist — dispense prescriptions, manage inventory |
| `PATIENT` | Patient — self-service view of their flow status |

**DepartmentState** — Patient flow states:
| Value | Description |
|-------|------------|
| `AWAITING_TRIAGE` | Patient has arrived, awaiting nurse triage |
| `AWAITING_DOCTOR` | Patient triaged, awaiting doctor consultation |
| `AWAITING_LAB` | Doctor ordered lab tests, awaiting lab processing |
| `AWAITING_DOCTOR_REVIEW` | Lab results or pharmacy done, awaiting doctor review |
| `AWAITING_PHARMACY` | Doctor prescribed medication, awaiting pharmacy |
| `DISCHARGED` | Patient has been discharged |

### Entity-Relationship Diagram

```
┌──────────────────┐        ┌────────────────────┐
│       User        │        │    PatientFlow      │
├──────────────────┤        ├────────────────────┤
│ id (UUID, PK)    │────1:1─►│ id (UUID, PK)      │
│ email (unique)   │        │ patientId (FK, unique)│
│ password (hash)  │        │ currentState        │
│ name             │        │ assignedDoctorId    │
│ role (Role enum) │        │ assignedLabId      │
│ createdAt        │        │ assignedPharmId    │
│ updatedAt        │        │ queueEnteredAt     │
└──────────────────┘        │ updatedAt           │
        │                   └────────────────────┘
        │
        │ 1:N ──────────────────────────────────────────
        │                                                  │
        ▼                          ▼                       ▼
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│ ConsultationNote │   │     LabTest       │   │   Prescription   │
├──────────────────┤   ├──────────────────┤   ├──────────────────┤
│ id (UUID, PK)    │   │ id (UUID, PK)    │   │ id (UUID, PK)    │
│ patientId (FK)   │   │ patientId (FK)   │   │ patientId (FK)   │
│ doctorId (FK)    │   │ testName         │   │ drugName         │
│ notes (encrypted)│   │ status           │   │ dosage           │
│ isImmutable      │   │ resultData (enc) │   │ status           │
│ createdAt        │   │ labTechId (FK)   │   │ pharmacistId (FK) │
│                  │   │ createdAt        │   │ createdAt        │
│                  │   │ updatedAt        │   │ dispensedAt      │
└──────────────────┘   └──────────────────┘   └──────────────────┘
        │                       │                       │
        │                       │                       │
        ▼                       ▼                       ▼
  Doctor → Patient         LabTech → Patient      Pharmacist → Patient


┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│      Vitals       │   │     Inventory     │   │       Drug        │
├──────────────────┤   ├──────────────────┤   ├──────────────────┤
│ id (UUID, PK)    │   │ id (UUID, PK)    │   │ id (UUID, PK)    │
│ patientId (FK)   │   │ drugName (unique) │   │ name (unique)    │
│ nurseId (FK)    │   │ stock            │   │ description      │
│ temperature      │   │ updatedAt        │   │ isDefault        │
│ bloodPressure    │   └──────────────────┘   │ createdAt        │
│ heartRate        │                            │ updatedAt        │
│ weight           │                            └──────────────────┘
│ respiratoryRate  │
│ oxygenSaturation │   ┌─────────────────────┐
│ notes            │   │  LabTestTemplate     │
│ createdAt        │   ├─────────────────────┤
│                  │   │ id (UUID, PK)       │
└──────────────────┘   │ name (unique)       │
                       │ description         │
                       │ category            │
                       │ isDefault           │
                       │ createdAt           │
                       │ updatedAt           │
                       └─────────────────────┘
```

### Relationship Summary

| From | To | Relation | Description |
|------|----|----------|------------|
| User | PatientFlow | 1:1 | Each patient has exactly one flow record |
| User (Doctor) | ConsultationNote | 1:N | Doctor writes consultation notes |
| User (Patient) | ConsultationNote | 1:N | Notes belong to a patient |
| User (LabTech) | LabTest | 1:N | Lab tech processes tests |
| User (Patient) | LabTest | 1:N | Tests belong to a patient |
| User (Pharmacist) | Prescription | 1:N | Pharmacist dispenses prescriptions |
| User (Patient) | Prescription | 1:N | Prescriptions belong to a patient |
| User (Nurse) | Vitals | 1:N | Nurse records vitals |
| User (Patient) | Vitals | 1:N | Vitals belong to a patient |

### Encrypted Fields

The following fields are encrypted at rest using AES-256-CBC via a Prisma client extension:

| Model | Field | Encryption |
|-------|-------|-----------|
| ConsultationNote | `notes` | Encrypted on write, decrypted on read |
| LabTest | `resultData` | Encrypted on write, decrypted on read |

---

## 6. Authentication & Authorization

### JWT Authentication Flow

```
┌──────────┐   POST /auth/login    ┌──────────┐
│  Client   │ ──────────────────► │  Backend   │
│           │ {email, password}    │            │
│           │                      │ 1. Find user by email
│           │                      │ 2. Verify password (argon2)
│           │                      │ 3. Sign JWT {sub, email, role}
│           │   {access_token, user}│ 4. Return token + user
│           │ ◄────────────────── │            │
└──────────┘                      └──────────┘
     │
     │ Every subsequent request:
     │ Authorization: Bearer <access_token>
     │
     ▼
┌──────────┐                      ┌──────────┐
│  Client   │ ──────────────────► │  Guard     │
│           │   + Bearer token     │ Pipeline   │
│           │                      │            │
│           │                      │ 1. JwtAuthGuard
│           │                      │    → JwtStrategy.validate()
│           │                      │    → Look up user by sub
│           │                      │    → Set req.user
│           │                      │
│           │                      │ 2. RolesGuard
│           │                      │    → Read @Roles() metadata
│           │                      │    → Check req.user.role
│           │                      │    → Allow or deny
│           │                      │
│           │         ┌──────────┐│
│           │ ◄───────│Controller ││ (if authorized)
│           │ Response │ method   ││
└──────────┘          └──────────┘└──────────┘
```

### JWT Configuration

| Property | Value |
|----------|-------|
| Strategy | Passport JWT (`passport-jwt`) |
| Token Extraction | `Authorization: Bearer <token>` header |
| Secret | `process.env.JWT_SECRET` or fallback `"SUPER_SECRET_KEY"` |
| Expiration | 1 day (`expiresIn: '1d'`) |
| Payload | `{ sub: userId, email, role }` |

### Guards Decorators

| Decorator | Purpose | Location |
|-----------|---------|----------|
| `@UseGuards(JwtAuthGuard, RolesGuard)` | Requires valid JWT + role check | Applied at controller class level on all protected controllers |
| `@Roles(...roles: Role[])` | Restricts endpoint to specified roles | Applied at method or class level |
| `@CurrentUser()` | Extracts `req.user` into a parameter | Applied at method parameter level |

### AuthController — Public Routes

The `AuthController` is the **only controller without guards**. It exposes:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/login` | Authenticate with email/password, returns JWT |
| `POST` | `/auth/signup/patient` | Public patient self-registration (always creates PATIENT role) |

All other controllers require `JwtAuthGuard + RolesGuard`.

---

## 7. Patient Flow State Machine

The system models a patient's journey through the hospital as a **finite state machine**. Every patient starts at `AWAITING_TRIAGE` and progresses through defined states until `DISCHARGED`.

### State Diagram

```
                          ┌──────────────────┐
                          │  AWAITING_TRIAGE  │
                          │  (Patient arrives) │
                          └────────┬─────────┘
                                   │
                          Nurse assigns doctor
                          (POST /queue/assign-doctor)
                                   │
                                   ▼
                          ┌──────────────────┐
                 ┌────────│  AWAITING_DOCTOR  │────────┐
                 │        └──────────────────┘        │
                 │                                      │
          Discharge                        Doctor orders lab tests
     (PUT /queue/advance)           (POST /consultation/:id/lab)
                 │                                      │
                 │                                      ▼
                 │                        ┌──────────────────┐
                 │                        │   AWAITING_LAB    │
                 │                        └────────┬─────────┘
                 │                                  │
                 │                        Lab uploads results
                 │                   (POST /laboratory/:id/result)
                 │                                  │
                 │                                  ▼
                 │                        ┌──────────────────┐
                 │                        │AWAITING_DOCTOR_   │◄────────┐
                 │                        │    REVIEW        │         │
                 │                        └────────┬─────────┘         │
                 │                                  │                   │
                 │                  Doctor reviews results                │
                 │                          ┌───────┴───────┐           │
                 │                          │               │           │
                 │                    Prescribe drug   Discharge    │
                 │              (POST /consultation/   (PUT /queue/ │
                 │               :id/prescription)     advance)     │
                 │                          │                        │
                 │                          ▼                        │
                 │                ┌──────────────────┐                │
                 │                │ AWAITING_PHARMACY │               │
                 │                └────────┬─────────┘               │
                 │                         │                         │
                 │                Pharmacist dispenses                 │
                 │              (POST /pharmacy/:id/dispense)        │
                 │                         │                         │
                 │                         └─────────────────────────┘
                 │                              (Returns to doctor review)
                 │
                 ▼
        ┌──────────────────┐
        │    DISCHARGED     │
        │ (Patient released) │
        └──────────────────┘
```

### State Transitions — Who Can Trigger Them

| From State | To State | Trigger | Who |
|-----------|---------|---------|-----|
| — | AWAITING_TRIAGE | Patient registration | System (auto) |
| AWAITING_TRIAGE | AWAITING_DOCTOR | Assign doctor to patient | NURSE, ADMIN |
| AWAITING_DOCTOR | AWAITING_LAB | Order lab test | DOCTOR, ADMIN |
| AWAITING_DOCTOR | AWAITING_PHARMACY | Prescribe drug | DOCTOR, ADMIN |
| AWAITING_DOCTOR | DISCHARGED | Manual advance | ADMIN, DOCTOR, NURSE |
| AWAITING_LAB | AWAITING_DOCTOR_REVIEW | Upload lab result | LAB_TECH, ADMIN |
| AWAITING_DOCTOR_REVIEW | AWAITING_PHARMACY | Prescribe drug | DOCTOR, ADMIN |
| AWAITING_DOCTOR_REVIEW | AWAITING_LAB | Order more lab tests | DOCTOR, ADMIN |
| AWAITING_DOCTOR_REVIEW | DISCHARGED | Discharge patient | ADMIN, DOCTOR, NURSE |
| AWAITING_PHARMACY | AWAITING_DOCTOR_REVIEW | Dispense prescription | PHARMACIST, ADMIN |
| Any state | Any state | Manual advance (PUT /queue/advance) | ADMIN, DOCTOR, NURSE |

### Queue Entry Reset

Every time a patient's state is advanced (manually or via action), the `queueEnteredAt` timestamp is reset to `now()`. This ensures fair FIFO ordering per-state.

---

## 8. Backend Modules — Detailed Reference

### 8.1 Users Module

**Route Prefixes**: `/auth` (AuthController), `/users` (UsersController)

**Purpose**: Authentication (login/signup) and user management (CRUD for staff/patients, activity history).

#### AuthController (`/auth`)

| Method | Endpoint | Auth | Body | Response | Description |
|--------|----------|-----|------|----------|------------|
| POST | `/auth/login` | None | `{ email, password }` | `{ access_token, user }` | Authenticate user, return JWT |
| POST | `/auth/signup/patient` | None | `{ email, name, password }` | `{ id, email, name, role }` | Public patient self-registration |

#### UsersController (`/users`)

| Method | Endpoint | Roles | Body/Params | Response | Description |
|--------|----------|-------|-------------|----------|------------|
| POST | `/users/staff` | ADMIN | `{ email, name, password, role }` | `{ id, email, name, role }` | Create staff member (non-PATIENT role) |
| POST | `/users/patient` | ADMIN, NURSE, DOCTOR | `{ email, name, password }` | `{ id, email, name, role, patientFlow }` | Create patient (includes patientFlow) |
| GET | `/users/staff` | ADMIN | — | `StaffMember[]` | List all non-PATIENT users |
| GET | `/users/doctors` | ADMIN, NURSE | — | `StaffMember[]` | List all doctors (ordered by name) |
| GET | `/users/staff/:id/history` | ADMIN, DOCTOR, NURSE, LAB_TECH, PHARMACIST | — | `{ consultations, labTests, prescriptions, vitals }` | Get staff member's full activity history |

#### UsersService — Key Methods

| Method | Description |
|--------|------------|
| `login(email, pass)` | Verifies credentials with argon2, returns JWT + user object |
| `createStaff(dto)` | Creates non-PATIENT user, enforces email uniqueness, hashes password |
| `createPatient(dto)` | Creates PATIENT user with nested `patientFlow` record (AWAITING_TRIAGE) |
| `registerPatient(dto)` | Public-facing patient creation (returns subset, no patientFlow) |
| `findStaff()` | Returns all non-PATIENT users |
| `findDoctors()` | Returns all DOCTOR-role users ordered by name |
| `getStaffHistory(id)` | Returns consultations, lab tests, prescriptions, and vitals for a staff member |

#### DTOs

- **LoginDto**: `{ email: string, password: string }` — no validation decorators
- **CreatePatientDto**: `{ email: string, name: string, password: string }` — no validation decorators
- **CreateStaffDto**: `{ email: string, name: string, password: string, role: Role }` — no validation decorators

---

### 8.2 Queue Module

**Route Prefix**: `/queue`
**Global Module**: Yes (`@Global()`)

**Purpose**: Manages patient flow state machine, queue lookups by department, doctor assignment, and WebSocket broadcasting on state changes.

#### QueueController (`/queue`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|------------|
| GET | `/queue/triage` | ADMIN, NURSE | Patients in AWAITING_TRIAGE |
| GET | `/queue/doctor` | ADMIN, DOCTOR | Patients in AWAITING_DOCTOR or AWAITING_DOCTOR_REVIEW (filtered by assigned doctor if DOCTOR role) |
| GET | `/queue/nurse` | ADMIN, NURSE | Patients in AWAITING_DOCTOR_REVIEW |
| GET | `/queue/doctors` | ADMIN, NURSE | Available doctors for assignment |
| GET | `/queue/laboratory` | ADMIN, LAB_TECH | Patients in AWAITING_LAB |
| GET | `/queue/pharmacy` | ADMIN, PHARMACIST | Patients in AWAITING_PHARMACY |
| GET | `/queue/patient/:id` | Any authenticated | Specific patient's flow record |
| PUT | `/queue/advance/:patientId` | ADMIN, NURSE, DOCTOR | Advance patient to new state, optionally assign doctor |
| POST | `/queue/assign-doctor/:patientId` | ADMIN, NURSE | Assign doctor, auto-advance to AWAITING_DOCTOR |

#### QueueService — Key Methods

| Method | Description |
|--------|------------|
| `getQueueByState(states, where?)` | Flexible query returning PatientFlow records for given states |
| `getPatientState(patientId)` | Returns a specific patient's flow record |
| `getAssignableDoctors()` | Returns all DOCTOR-role users |
| `advanceState(patientId, newState, meta?)` | Updates patient state, optionally sets assignedDoctor/Lab/Pharm IDs, resets queueEnteredAt, broadcasts WebSocket |
| `advanceStateInTx(tx, patientId, newState, meta?)` | Transaction-safe version for use inside `$transaction` blocks |
| `assignPatientToDoctor(patientId, doctorId)` | Validates doctor exists with DOCTOR role, then advances to AWAITING_DOCTOR |

---

### 8.3 Consultation Module

**Route Prefix**: `/consultation`
**Class-level Roles**: DOCTOR, ADMIN

**Purpose**: Manages consultation notes, lab test orders, and prescriptions created during a doctor's consultation with a patient.

#### ConsultationController (`/consultation`)

| Method | Endpoint | Description |
|--------|----------|------------|
| GET | `/consultation/:patientId/notes` | Get all consultation notes for a patient |
| GET | `/consultation/:patientId/lab-results` | Get all lab test results for a patient |
| POST | `/consultation/:patientId/note` | Create consultation note (body: `{ notes }`) |
| POST | `/consultation/:patientId/lab` | Order lab test, advances to AWAITING_LAB (body: `{ testName }`) |
| POST | `/consultation/:patientId/prescription` | Prescribe drug, advances to AWAITING_PHARMACY (body: `{ drugName, dosage }`) |

#### ConsultationService — Key Methods

| Method | Description |
|--------|------------|
| `createNote(doctorId, patientId, notes)` | Creates encrypted ConsultationNote record |
| `getPatientNotes(patientId)` | Returns all notes for a patient (auto-decrypted) |
| `getPatientLabResults(patientId)` | Returns all lab tests for a patient (auto-decrypted) |
| `orderLabTest(doctorId, patientId, testName)` | Transaction: create LabTest + advance state to AWAITING_LAB |
| `prescribeDrug(doctorId, patientId, drugName, dosage)` | Transaction: create Prescription + advance state to AWAITING_PHARMACY |

---

### 8.4 Laboratory Module

**Route Prefix**: `/laboratory`
**Class-level Roles**: LAB_TECH, ADMIN

**Purpose**: Manages lab test worklist, results upload, and test templates.

#### LaboratoryController (`/laboratory`)

| Method | Endpoint | Description |
|--------|----------|------------|
| GET | `/laboratory/worklist` | PENDING lab tests (worklist) |
| GET | `/laboratory/all` | ALL lab tests (full history) |
| POST | `/laboratory/:testId/result` | Upload test result, advances patient to AWAITING_DOCTOR_REVIEW (body: `{ resultData }`) |

#### LaboratoryService — Key Methods

| Method | Description |
|--------|------------|
| `getWorklist()` | Returns PENDING lab tests |
| `getAllTests()` | Returns all lab tests with patient and labTech info |
| `uploadResult(testId, labTechId, resultData)` | Transaction: update test to COMPLETED + advance patient to AWAITING_DOCTOR_REVIEW |

---

### 8.5 Pharmacy Module

**Route Prefix**: `/pharmacy`

**Purpose**: Manages prescription dispensing and drug inventory.

#### PharmacyController (`/pharmacy`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|------------|
| GET | `/pharmacy/worklist` | PHARMACIST, ADMIN | PENDING prescriptions |
| GET | `/pharmacy/all` | PHARMACIST, ADMIN | ALL prescriptions |
| POST | `/pharmacy/:rxId/dispense` | PHARMACIST, ADMIN | Dispense prescription (validates stock, decrements inventory) |
| POST | `/pharmacy/inventory` | PHARMACIST, ADMIN | Add to inventory (body: `{ drugName, quantity }`) |
| GET | `/pharmacy/inventory` | PHARMACIST, ADMIN, DOCTOR | View all inventory |

#### PharmacyService — Key Methods

| Method | Description |
|--------|------------|
| `getWorklist()` | Returns PENDING prescriptions |
| `getAllPrescriptions()` | Returns all prescriptions with patient and pharmacist info |
| `dispense(prescriptionId, pharmacistId)` | Transaction: validate PENDING + check stock > 0 + decrement inventory + mark DISPENSED + advance to AWAITING_DOCTOR_REVIEW |
| `addInventory(drugName, quantity)` | Upsert: increment stock if drug exists, create if not |
| `getInventory()` | Returns all inventory records |

---

### 8.6 Drug Module

**Route Prefix**: `/drugs`

**Purpose**: CRUD for the drug catalog (not inventory — that's in Pharmacy).

#### DrugController (`/drugs`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|------------|
| GET | `/drugs` | ADMIN, DOCTOR, PHARMACIST, LAB_TECH, NURSE | List all drugs |
| POST | `/drugs` | ADMIN, PHARMACIST | Create drug (body: `{ name, description? }`) |
| DELETE | `/drugs/:id` | ADMIN, PHARMACIST | Delete drug (hard delete) |

---

### 8.7 Lab Test Template Module

**Route Prefix**: `/lab-test-templates`

**Purpose**: CRUD for lab test template catalog (predefined test types).

#### LabTestTemplateController (`/lab-test-templates`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|------------|
| GET | `/lab-test-templates` | ADMIN, DOCTOR, PHARMACIST, LAB_TECH, NURSE | List all templates |
| POST | `/lab-test-templates` | ADMIN, LAB_TECH | Create template (body: `{ name, description?, category? }`) |
| DELETE | `/lab-test-templates/:id` | ADMIN, LAB_TECH | Delete template (hard delete) |

---

### 8.8 Vitals Module

**Route Prefix**: `/vitals`

**Purpose**: Record and retrieve patient vitals (temperature, blood pressure, heart rate, weight, respiratory rate, oxygen saturation, notes).

#### VitalsController (`/vitals`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|------------|
| POST | `/vitals/:patientId` | NURSE, ADMIN, DOCTOR | Record vitals (body: `{ temperature?, bloodPressure?, heartRate?, weight?, respiratoryRate?, oxygenSaturation?, notes? }`) |
| GET | `/vitals/:patientId` | DOCTOR, NURSE, ADMIN | Get patient's vitals history |

> **Note**: Recording vitals does NOT advance the patient flow state. The state advances when a doctor is assigned.

---

## 9. Frontend Architecture

### 9.1 Routing & Pages

The frontend uses Next.js App Router with file-based routing. All pages are client components (`'use client'`) except the root layout.

| Route | Page | Access | Description |
|-------|------|--------|------------|
| `/` | `page.tsx` | All | Redirects based on auth state |
| `/login` | `login/page.tsx` | Public | Email/password login |
| `/signup` | `signup/page.tsx` | Public | Patient self-registration |
| `/dashboard` | `dashboard/page.tsx` | Auth | Role-based redirect hub |
| `/dashboard/admin` | `admin/page.tsx` | ADMIN | Overview: stats, create staff/patient, triage, staff directory |
| `/dashboard/admin/patients` | `admin/patients/page.tsx` | ADMIN | Re-exports check-patients |
| `/dashboard/admin/patients/[id]` | `admin/patients/[id]/page.tsx` | ADMIN | Full patient detail with history |
| `/dashboard/admin/pharmacy` | `admin/pharmacy/page.tsx` | ADMIN | Read-only prescription & inventory ledger |
| `/dashboard/admin/laboratory` | `admin/laboratory/page.tsx` | ADMIN | Read-only lab test ledger |
| `/dashboard/admin/nurses` | `admin/nurses/page.tsx` | ADMIN | Nurse management & discharge queue |
| `/dashboard/admin/nurses/[id]` | `admin/nurses/[id]/page.tsx` | ADMIN | Specific nurse's triage history |
| `/dashboard/admin/doctors` | `admin/doctors/page.tsx` | ADMIN | Doctor directory |
| `/dashboard/admin/doctors/[id]` | `admin/doctors/[id]/page.tsx` | ADMIN | Specific doctor's consultation history |
| `/dashboard/check-patients` | `check-patients/page.tsx` | ADMIN, DOCTOR, NURSE | Unified patient lookup with search |
| `/dashboard/history` | `history/page.tsx` | All staff | Current user's activity history |
| `/dashboard/nurse` | `nurse/page.tsx` | NURSE | Triage queue, vitals, doctor assignment, discharge |
| `/dashboard/patient` | `patient/page.tsx` | PATIENT | Self-service flow status view |
| `/dashboard/pharmacy` | `pharmacy/page.tsx` | PHARMACIST | Dispense prescriptions, manage inventory |
| `/dashboard/laboratory` | `laboratory/page.tsx` | LAB_TECH | Lab worklist, upload results, manage templates |
| `/dashboard/doctor` | `doctor/page.tsx` | DOCTOR | Full consultation workflow |

### 9.2 Shared Components

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `Sidebar` | Role-filtered navigation sidebar (220px fixed) | None (reads AuthContext) |
| `DashboardShell` | Layout wrapper: Sidebar + header + content | `title`, `subtitle`, `headerActions`, `children` |
| `QueueTable` | Reusable data table with row selection, actions, status badges | `columns`, `data`, `onRowClick`, `selectedId`, `actions`, `isLoading` |
| `StatCard` | KPI metric display with large monospace value | `icon`, `label`, `value`, `subtitle` |
| `StatusBadge` | Visual status indicator for patient flow states | `status`, `size`, `isActive` |
| `GlassCard` | Content container with configurable padding | `children`, `padding`, `className` |
| `DarkModeToggle` | Light/dark theme switch button | None (uses ThemeContext) |

### 9.3 State Management

| Concern | Approach |
|---------|----------|
| Authentication | React Context (`AuthContext`) — provides `user`, `token`, `login`, `logout`, `isLoading` |
| Theme | React Context (`ThemeContext`) — provides `theme`, `toggleTheme`, persists in localStorage |
| Local UI State | `useState` for form data, toggles, API responses |
| Real-Time | `useSocket()` hook returns `lastUpdate` timestamp; pages re-fetch data in `useEffect` when it changes |
| Memoization | `useCallback` for async fetchers, `useMemo` for derived data |

#### AuthContext — Role-to-Dashboard Mapping

| Role | Default Route |
|------|-------------|
| ADMIN | `/dashboard/admin` |
| DOCTOR | `/dashboard/doctor` |
| NURSE | `/dashboard/nurse` |
| LAB_TECH | `/dashboard/laboratory` |
| PHARMACIST | `/dashboard/pharmacy` |
| PATIENT | `/dashboard/patient` |

### 9.4 Real-Time Updates

The `useSocket(patientId?)` hook:

1. Connects to the backend Socket.IO server on `NEXT_PUBLIC_WS_URL` or `http://localhost:3001`
2. Listens for `queueUpdate` events (broadcast to all clients)
3. Optionally listens for `patientUpdate-{patientId}` events (patient-specific updates)
4. Updates `lastUpdate` timestamp, which triggers `useEffect` re-fetches in consuming pages
5. Tracks `isConnected` status for the header indicator

**Usage pattern**:
```typescript
const { lastUpdate, isConnected } = useSocket(user.id);

useEffect(() => {
  fetchData();
}, [lastUpdate]); // Re-fetch when queue changes
```

### 9.5 API Client

The API client (`src/lib/api.ts`) provides:

- **`fetchApi<T>(path, options)`** — Centralized fetch wrapper with:
  - Auto-injection of `Authorization: Bearer <token>` header
  - JSON content-type header
  - Error parsing (attempts to read `message` from response body)
  - Custom `ApiError` class with `status` and `message`
  - 204 No Content handling

- **35 typed API functions** organized by domain (Auth, Users, Queue, Consultation, Laboratory, Pharmacy, Drugs, Lab Test Templates, Vitals, Patient History)

- **Token helpers**: `getToken()`, `setToken()`, `clearToken()`, `getStoredUser()`, `setStoredUser()` — all using localStorage

### 9.6 Design System

The frontend uses a **custom Brutalist Minimalist Design System** (NOT shadcn/ui):

| Property | Implementation |
|----------|---------------|
| Typography | Space Mono (monospace font) throughout |
| Colors | CSS custom properties (`--bg`, `--text`, `--border`, `--accent`, etc.) with light/dark themes |
| Border Radius | `border-radius: 0 !important` — all elements are sharp-cornered |
| Transitions | `transition: none !important` — no animations |
| Buttons | `.btn`, `.btn-primary`, `.btn-danger`, `.btn-sm`, `.btn-ghost`, `.btn-icon` |
| Cards | `.card` with border-based styling, `.card-header`, `.card-body` |
| Tables | `.data-table` with hover states |
| Modals | `.modal-overlay`, `.modal-content`, `.modal-header/footer` |
| Badges | StatusBadge component maps `DepartmentState` values to labels |
| Theme Toggle | Dark/light mode via `data-theme` attribute on `<html>`, persisted in localStorage |

---

## 10. Real-Time Communication (WebSocket)

### Architecture

The backend exposes a Socket.IO gateway via `QueueGateway`:

```
┌──────────────┐     Socket.IO      ┌──────────────────┐
│  Frontend    │ ◄────────────────► │  QueueGateway    │
│  useSocket() │    WebSocket       │  (NestJS)        │
│  hook        │                    │  port 3001       │
└──────────────┘                    └──────────────────┘
```

### Events

| Event | Direction | Payload | Trigger |
|-------|-----------|---------|---------|
| `connection` | Client → Server | — | Client connects |
| `disconnect` | Client → Server | — | Client disconnects |
| `queueUpdate` | Server → Client | `{ timestamp: ISO string }` | Any patient flow state change |
| `patientUpdate-{patientId}` | Server → Client | `{ timestamp: ISO string }` | Specific patient flow change |

### When Events Are Emitted

The `QueueService.emitQueueStateChanged(patientId)` method is called after every state change:
- After `advanceState()`
- After `assignPatientToDoctor()`
- After lab result upload
- After prescription dispensing
- After lab test ordering
- After drug prescription

### Frontend Handling

Each dashboard page:
1. Calls `useSocket()` or `useSocket(patientId)` to connect
2. Uses `lastUpdate` as a `useEffect` dependency
3. Re-fetches data from REST APIs when `lastUpdate` changes
4. This ensures all connected clients see live queue updates

---

## 11. Data Encryption & Security

### AES-256-CBC Encryption

The `PrismaService` extends the base `PrismaClient` with a `$extends()` query extension that automatically encrypts/decrypts sensitive fields:

**Encryption Process** (`encrypt` function):
1. Generate a random 16-byte IV using `crypto.randomBytes(16)`
2. Create an AES-256-CBC cipher with the encryption key and IV
3. Encrypt the plaintext as UTF-8, output as hex
4. Format: `<iv_hex>:<encrypted_hex>`

**Decryption Process** (`decrypt` function):
1. Split on `:` — first part is IV (hex), remainder is ciphertext (hex)
2. Create AES-256-CBC decipher
3. Decrypt and return UTF-8 string
4. If input doesn't contain `:`, return as-is (supports legacy unencrypted data)

**Encrypted Fields**:
| Model | Field | Operation |
|-------|-------|-----------|
| ConsultationNote | `notes` | Encrypted on create/update, decrypted on read |
| LabTest | `resultData` | Encrypted on create/update, decrypted on read |

**Key Configuration**:
- Environment variable: `ENCRYPTION_KEY`
- Fallback: Hardcoded key `'12345678901234567890123456789012'` (32 bytes)

**Usage Convention**: All services use `this.prisma.client.xxx` (the extended client) for automatic encryption/decryption. The base `PrismaClient` methods are still available directly on the `PrismaService` instance but do NOT apply encryption.

### Other Security Measures

| Measure | Implementation |
|---------|---------------|
| Password hashing | Argon2 (verified on login) |
| JWT authentication | Passport JWT strategy, Bearer token |
| Role-based access | Custom `@Roles()` decorator + `RolesGuard` |
| CORS | Whitelisted origins: `localhost:3000`, `127.0.0.1:3000` |
| Auth guard | Applied at controller class level on all protected routes |

---

## 12. Role-Based Workflows

### 12.1 ADMIN Workflow

The ADMIN has the broadest access across the entire system:

```
┌─────────────────────────────────────────────────────────────┐
│                     ADMIN DASHBOARD                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐    │
│  │ Create Staff │  │ Create Patient│  │ View All Queues │   │
│  │ (DOCTOR,     │  │ (auto creates │  │ (Triage, Doctor,│   │
│  │  NURSE,      │  │  patientFlow) │  │  Lab, Pharmacy) │   │
│  │  LAB_TECH,   │  └──────────────┘  └─────────────────┘   │
│  │  PHARMACIST, │                                         │
│  │  ADMIN)      │  ┌──────────────────────────────────┐    │
│  └─────────────┘  │ Assign Doctor from Triage Queue    │    │
│                     │ (select doctor, auto-advance to   │    │
│                     │  AWAITING_DOCTOR)                 │    │
│                     └──────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────┐  ┌──────────────────────────┐      │
│  │ Staff Directory      │  │ Patient Detail ([id])    │      │
│  │ - View all staff     │  │ - Vitals history         │      │
│  │ - View history       │  │ - Consultation notes     │      │
│  │ - Doctor directory   │  │ - Lab results             │      │
│  │ - Nurse management   │  │ - Reassign doctor        │      │
│  └─────────────────────┘  └──────────────────────────┘      │
│                                                              │
│  ┌─────────────────────┐  ┌──────────────────────────┐      │
│  │ Admin Pharmacy       │  │ Admin Laboratory          │      │
│  │ (read-only ledger)   │  │ (read-only ledger)         │      │
│  └─────────────────────┘  └──────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

**Accessible Endpoints**: All endpoints (full access).

---

### 12.2 NURSE Workflow

The NURSE handles triage, vitals recording, and patient discharge:

```
┌──────────────────────────────────────────────────┐
│              NURSE DESK                           │
├──────────────────────────────────────────────────┤
│                                                   │
│  ┌───────────────────────┐  ┌──────────────────┐ │
│  │ TRIAGE QUEUE           │  │ REVIEW QUEUE      │ │
│  │ (AWAITING_TRIAGE)      │  │ (AWAITING_DOCTOR_ │ │
│  │                        │  │  REVIEW)           │ │
│  │  1. Select patient      │  │                   │ │
│  │  2. Record vitals:      │  │  - Discharge      │ │
│  │     - Temperature       │  │    (advance to    │ │
│  │     - Blood Pressure    │  │     DISCHARGED)   │ │
│  │     - Heart Rate        │  └──────────────────┘ │
│  │     - Weight            │                       │
│  │     - Respiratory Rate  │                       │
│  │     - O2 Saturation     │                       │
│  │  3. Assign doctor       │                       │
│  │     → Advances to       │                       │
│  │       AWAITING_DOCTOR   │                       │
│  └───────────────────────┘                        │
│                                                   │
│  ┌───────────────────────┐                        │
│  │ CHECK PATIENTS         │                        │
│  │ - Search all patients  │                        │
│  │ - View vitals only     │                        │
│  └───────────────────────┘                        │
└──────────────────────────────────────────────────┘
```

**Accessible Endpoints**:
- `GET /queue/triage`, `GET /queue/nurse`, `GET /queue/doctors`
- `POST /queue/assign-doctor/:patientId`
- `PUT /queue/advance/:patientId` (for discharge)
- `POST /vitals/:patientId`, `GET /vitals/:patientId`
- `GET /users/doctors`
- `GET /users/staff/:id/history`
- `GET /drugs`
- `GET /lab-test-templates`

---

### 12.3 DOCTOR Workflow

The DOCTOR has a full consultation workflow:

```
┌──────────────────────────────────────────────────────────────┐
│                    DOCTOR DESK                                │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────┐  ┌──────────────────────────┐ │
│  │ PATIENT QUEUE            │  │ CONSULTATION PANEL         │ │
│  │ (AWAITING_DOCTOR or      │  │ (selected patient)         │ │
│  │  AWAITING_DOCTOR_REVIEW) │  │                            │ │
│  │                          │  │ ┌────────────────────────┐│ │
│  │  - Click patient to      │  │ │ Vitals Display         ││ │
│  │    select                │  │ │ (recent vitals)         ││ │
│  └─────────────────────────┘  │ └────────────────────────┘│ │
│                               │ ┌────────────────────────┐│ │
│                               │ │ Action Toolbar:         ││ │
│                               │ │ 📝 Note | 🧪 Lab |    ││ │
│                               │ │ 💊 Rx   | 📋 History | ││ │
│                               │ │ 🚪 Discharge           ││ │
│                               │ └────────────────────────┘│ │
│                               │                            │ │
│                               │ 📝 Note: Textarea for      │ │
│                               │     consultation notes      │ │
│                               │                            │ │
│                               │ 🧪 Lab: Select test from   │ │
│                               │     template dropdown      │ │
│                               │     → Advances to AWAITING_ │ │
│                               │       LAB                  │ │
│                               │                            │ │
│                               │ 💊 Rx: Drug dropdown +     │ │
│                               │     dosage input           │ │
│                               │     → Advances to AWAITING_ │ │
│                               │       PHARMACY             │ │
│                               │                            │ │
│                               │ 📋 History: Vitals, notes, │ │
│                               │     lab results             │ │
│                               │                            │ │
│                               │ 🚪 Discharge: Advance to   │ │
│                               │     DISCHARGED              │ │
│                               └──────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

**Accessible Endpoints**:
- `GET /queue/doctor`, `GET /queue/patient/:id`
- `GET /consultation/:patientId/notes`, `GET /consultation/:patientId/lab-results`
- `POST /consultation/:patientId/note`
- `POST /consultation/:patientId/lab`
- `POST /consultation/:patientId/prescription`
- `PUT /queue/advance/:patientId`
- `GET /vitals/:patientId`
- `GET /drugs`, `GET /lab-test-templates`
- `GET /pharmacy/inventory`
- `GET /users/staff/:id/history`

---

### 12.4 LAB_TECH Workflow

```
┌────────────────────────────────────────────────┐
│            LABORATORY DASHBOARD                  │
├────────────────────────────────────────────────┤
│                                                  │
│  ┌────────────────────────┐  ┌────────────────┐ │
│  │ TEST WORKLIST           │  │ UPLOAD RESULT   │ │
│  │ (PENDING lab tests)     │  │                 │ │
│  │                         │  │ - Select test    │ │
│  │  - Patient name         │  │ - Enter result   │ │
│  │  - Test name             │  │   data (text)   │ │
│  │  - Status: PENDING       │  │ - Submit         │ │
│  │                         │  │                  │ │
│  │  Click → Select test    │  │ → Status becomes │ │
│  │                         │  │   COMPLETED       │ │
│  └────────────────────────┘  │ → Patient advances│ │
│                               │   to AWAITING_    │ │
│  ┌────────────────────────┐  │   DOCTOR_REVIEW   │ │
│  │ LAB TEST TEMPLATES       │  └────────────────┘ │
│  │ - Create custom templates│                     │
│  │ - View all templates     │                     │
│  └────────────────────────┘                      │
└────────────────────────────────────────────────┘
```

**Accessible Endpoints**:
- `GET /laboratory/worklist`, `GET /laboratory/all`
- `POST /laboratory/:testId/result`
- `GET /lab-test-templates`, `POST /lab-test-templates`, `DELETE /lab-test-templates/:id`
- `GET /users/staff/:id/history`

---

### 12.5 PHARMACIST Workflow

```
┌─────────────────────────────────────────────────┐
│             PHARMACY DASHBOARD                    │
├─────────────────────────────────────────────────┤
│                                                   │
│  ┌────────────────────────┐  ┌─────────────────┐ │
│  │ PRESCRIPTION WORKLIST   │  │ INVENTORY         │ │
│  │ (PENDING prescriptions)  │  │                   │ │
│  │                           │  │ - Drug stock      │ │
│  │  - Patient name           │  │   levels           │ │
│  │  - Drug name              │  │ - Add stock        │ │
│  │  - Dosage                 │  │ - Add new drug     │ │
│  │  - Status: PENDING        │  │ - Low stock alert   │ │
│  │                           │  │   (≤5 units)        │ │
│  │  Dispense button:          │  └─────────────────┘ │
│  │  - Validates stock > 0     │                     │
│  │  - Decrements inventory    │                     │
│  │  - Marks Rx as DISPENSED   │                     │
│  │  - Advances patient to     │                     │
│  │    AWAITING_DOCTOR_REVIEW   │                     │
│  └────────────────────────┘                      │
└─────────────────────────────────────────────────┘
```

**Accessible Endpoints**:
- `GET /pharmacy/worklist`, `GET /pharmacy/all`
- `POST /pharmacy/:rxId/dispense`
- `POST /pharmacy/inventory`, `GET /pharmacy/inventory`
- `GET /drugs`, `POST /drugs`, `DELETE /drugs/:id`
- `GET /users/staff/:id/history`

---

### 12.6 PATIENT Workflow

```
┌─────────────────────────────────────────────┐
│           PATIENT DASHBOARD                  │
├─────────────────────────────────────────────┤
│                                               │
│  ┌───────────────────────────────────────┐    │
│  │ Welcome, [Patient Name]                │    │
│  │ Status: [Current Department State]     │    │
│  │ Live indicator                         │    │
│  └───────────────────────────────────────┘    │
│                                               │
│  ┌───────────────────────────────────────┐    │
│  │ VISUAL PROGRESS STEPPER                │    │
│  │                                         │    │
│  │  ✅ Awaiting Triage                    │    │
│  │  ✅ Awaiting Doctor                    │    │
│  │  🔵 Awaiting Lab       ← (current)    │    │
│  ○  Awaiting Doctor Review                │    │
│  ○  Awaiting Pharmacy                     │    │
│  ○  Discharged                             │    │
│  └───────────────────────────────────────┘    │
│                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌────────┐ │
│  │ Queue       │  │ Assigned    │  │ Time   │ │
│  │ Entered     │  │ Doctor      │  │ in     │ │
│  │ [datetime]   │  │ [name or    │  │ Queue  │ │
│  │              │  │  Unassigned] │  │ [dur]  │ │
│  └─────────────┘  └─────────────┘  └────────┘ │
└─────────────────────────────────────────────┘
```

**Accessible Endpoints**:
- `GET /queue/patient/:id` (their own patient flow status)
- Real-time updates via `patientUpdate-{patientId}` WebSocket event

---

## 13. Complete API Reference

### Authentication

| # | Method | Endpoint | Auth | Roles | Request Body | Response |
|---|--------|----------|------|-------|-------------|----------|
| 1 | POST | `/auth/login` | None | Public | `{ email, password }` | `{ access_token, user: { id, email, name, role } }` |
| 2 | POST | `/auth/signup/patient` | None | Public | `{ email, name, password }` | `{ id, email, name, role }` |

### Users

| # | Method | Endpoint | Roles | Request Body | Response |
|---|--------|----------|-------|-------------|----------|
| 3 | POST | `/users/staff` | ADMIN | `{ email, name, password, role }` | `{ id, email, name, role }` |
| 4 | POST | `/users/patient` | ADMIN, NURSE, DOCTOR | `{ email, name, password }` | `{ id, email, name, role, patientFlow }` |
| 5 | GET | `/users/staff` | ADMIN | — | `StaffMember[]` |
| 6 | GET | `/users/doctors` | ADMIN, NURSE | — | `StaffMember[]` |
| 7 | GET | `/users/staff/:id/history` | ADMIN, DOCTOR, NURSE, LAB_TECH, PHARMACIST | — | `{ consultations, labTests, prescriptions, vitals }` |

### Queue

| # | Method | Endpoint | Roles | Request Body | Response |
|---|--------|----------|-------|-------------|----------|
| 8 | GET | `/queue/triage` | ADMIN, NURSE | — | `PatientFlow[]` |
| 9 | GET | `/queue/doctor` | ADMIN, DOCTOR | — | `PatientFlow[]` |
| 10 | GET | `/queue/nurse` | ADMIN, NURSE | — | `PatientFlow[]` |
| 11 | GET | `/queue/doctors` | ADMIN, NURSE | — | `StaffMember[]` |
| 12 | GET | `/queue/laboratory` | ADMIN, LAB_TECH | — | `PatientFlow[]` |
| 13 | GET | `/queue/pharmacy` | ADMIN, PHARMACIST | — | `PatientFlow[]` |
| 14 | GET | `/queue/patient/:id` | Any authenticated | — | `PatientFlow` |
| 15 | PUT | `/queue/advance/:patientId` | ADMIN, NURSE, DOCTOR | `{ newState, assignedDoctorId? }` | `PatientFlow` |
| 16 | POST | `/queue/assign-doctor/:patientId` | ADMIN, NURSE | `{ doctorId }` | `PatientFlow` |

### Consultation

| # | Method | Endpoint | Roles | Request Body | Response |
|---|--------|----------|-------|-------------|----------|
| 17 | GET | `/consultation/:patientId/notes` | DOCTOR, ADMIN | — | `ConsultationNote[]` |
| 18 | GET | `/consultation/:patientId/lab-results` | DOCTOR, ADMIN | — | `LabTestResult[]` |
| 19 | POST | `/consultation/:patientId/note` | DOCTOR, ADMIN | `{ notes }` | `ConsultationNote` |
| 20 | POST | `/consultation/:patientId/lab` | DOCTOR, ADMIN | `{ testName }` | `LabTest` |
| 21 | POST | `/consultation/:patientId/prescription` | DOCTOR, ADMIN | `{ drugName, dosage }` | `Prescription` |

### Laboratory

| # | Method | Endpoint | Roles | Request Body | Response |
|---|--------|----------|-------|-------------|----------|
| 22 | GET | `/laboratory/worklist` | LAB_TECH, ADMIN | — | `LabTest[]` |
| 23 | GET | `/laboratory/all` | LAB_TECH, ADMIN | — | `LabTest[]` |
| 24 | POST | `/laboratory/:testId/result` | LAB_TECH, ADMIN | `{ resultData }` | `LabTest` |

### Pharmacy

| # | Method | Endpoint | Roles | Request Body | Response |
|---|--------|----------|-------|-------------|----------|
| 25 | GET | `/pharmacy/worklist` | PHARMACIST, ADMIN | — | `Prescription[]` |
| 26 | GET | `/pharmacy/all` | PHARMACIST, ADMIN | — | `Prescription[]` |
| 27 | POST | `/pharmacy/:rxId/dispense` | PHARMACIST, ADMIN | — | `Prescription` |
| 28 | POST | `/pharmacy/inventory` | PHARMACIST, ADMIN | `{ drugName, quantity }` | `InventoryItem` |
| 29 | GET | `/pharmacy/inventory` | PHARMACIST, ADMIN, DOCTOR | — | `InventoryItem[]` |

### Drugs

| # | Method | Endpoint | Roles | Request Body | Response |
|---|--------|----------|-------|-------------|----------|
| 30 | GET | `/drugs` | ADMIN, DOCTOR, PHARMACIST, LAB_TECH, NURSE | — | `Drug[]` |
| 31 | POST | `/drugs` | ADMIN, PHARMACIST | `{ name, description? }` | `Drug` |
| 32 | DELETE | `/drugs/:id` | ADMIN, PHARMACIST | — | `Drug` |

### Lab Test Templates

| # | Method | Endpoint | Roles | Request Body | Response |
|---|--------|----------|-------|-------------|----------|
| 33 | GET | `/lab-test-templates` | ADMIN, DOCTOR, PHARMACIST, LAB_TECH, NURSE | — | `LabTestTemplate[]` |
| 34 | POST | `/lab-test-templates` | ADMIN, LAB_TECH | `{ name, description?, category? }` | `LabTestTemplate` |
| 35 | DELETE | `/lab-test-templates/:id` | ADMIN, LAB_TECH | — | `LabTestTemplate` |

### Vitals

| # | Method | Endpoint | Roles | Request Body | Response |
|---|--------|----------|-------|-------------|----------|
| 36 | POST | `/vitals/:patientId` | NURSE, ADMIN, DOCTOR | `{ temperature?, bloodPressure?, heartRate?, weight?, respiratoryRate?, oxygenSaturation?, notes? }` | `Vitals` |
| 37 | GET | `/vitals/:patientId` | DOCTOR, NURSE, ADMIN | — | `Vitals[]` |

---

## 14. Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string (e.g., `postgresql://postgres:password@localhost:5432/telemedicine`) |
| `JWT_SECRET` | No | `SUPER_SECRET_KEY` | JWT signing secret |
| `ENCRYPTION_KEY` | No | `12345678901234567890123456789012` | AES-256-CBC encryption key (32 bytes) |
| `PORT` | No | `3001` | Server port |

### Frontend (`frontend/.env.local`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | No | `http://localhost:3001` | Backend API base URL |
| `NEXT_PUBLIC_WS_URL` | No | `http://localhost:3001` | WebSocket server URL |

### Docker (`docker-compose.yml`)

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_USER` | `postgres` | PostgreSQL admin user |
| `POSTGRES_PASSWORD` | `password` | PostgreSQL admin password |
| `POSTGRES_DB` | `telemedicine` | Database name |

### Seed (`prisma/seed.ts`)

| Variable | Default | Description |
|----------|---------|-------------|
| `ADMIN_EMAIL` | `admin@telemed.com` | Super admin email |
| `ADMIN_PASSWORD` | `AdminPassword123!` | Super admin password |

---

## 15. Seeding & Initial Data

The seed script (`prisma/seed.ts`) creates:

1. **Super Admin User** — Email: `admin@telemed.com`, Password: `AdminPassword123!`, Role: ADMIN
2. **Default Drugs** (12 items):

| Drug | Description | Category |
|------|------------|----------|
| Amoxicillin | Antibiotic for bacterial infections | General |
| Ibuprofen | NSAID for pain and inflammation | General |
| Paracetamol | Analgesic and antipyretic | General |
| Omeprazole | Proton pump inhibitor for acid reflux | General |
| Metformin | Oral diabetes medication | General |
| Amlodipine | Calcium channel blocker for hypertension | General |
| Ciprofloxacin | Fluoroquinolone antibiotic | General |
| Azithromycin | Macrolide antibiotic | General |
| Lisinopril | ACE inhibitor for blood pressure | General |
| Prednisone | Corticosteroid for inflammation | General |
| Cetirizine | Antihistamine for allergies | General |
| Salbutamol | Bronchodilator for asthma | General |

3. **Default Lab Test Templates** (12 items):

| Test | Description | Category |
|------|------------|----------|
| Complete Blood Count (CBC) | Measures blood cells and components | Hematology |
| Blood Glucose | Measures blood sugar levels | Biochemistry |
| Lipid Profile | Measures cholesterol and triglycerides | Biochemistry |
| Liver Function Tests | Measures liver enzyme levels | Biochemistry |
| Kidney Function Tests | Measures kidney performance markers | Biochemistry |
| Urinalysis | Analyzes urine composition | Urine |
| Thyroid Panel | Measures thyroid hormone levels | Endocrinology |
| HIV Test | Screens for HIV antibodies/antigens | Infectious Disease |
| Malaria Test | Rapid diagnostic test for malaria | Infectious Disease |
| Typhoid Test | Widal test for typhoid fever | Infectious Disease |
| Pregnancy Test | hCG hormone detection | Special |
| Chest X-Ray | Radiographic imaging of chest | Imaging |

Run the seed with:
```bash
cd backend && pnpm prisma db seed
```

---

## 16. Running the Application

### Prerequisites

- Node.js 18+
- pnpm
- Docker & Docker Compose
- PostgreSQL 16 (or use Docker)

### Step-by-Step

```bash
# 1. Start PostgreSQL
docker compose up -d

# 2. Backend setup
cd backend
pnpm install
pnpm prisma generate
pnpm prisma db push        # Create/migrate schema
pnpm prisma db seed         # Seed initial data
pnpm run start:dev           # Start backend on port 3001

# 3. Frontend setup (in a new terminal)
cd frontend
pnpm install
pnpm dev                    # Start frontend on port 3000
```

### Useful Commands

| Command | Directory | Description |
|---------|----------|-------------|
| `pnpm run start:dev` | `backend/` | Start backend in watch mode |
| `pnpm run build` | `backend/` | Build backend for production |
| `pnpm run lint` | `backend/` | Lint & fix backend code |
| `pnpm run test` | `backend/` | Run unit tests |
| `pnpm run test:e2e` | `backend/` | Run E2E tests |
| `pnpm prisma generate` | `backend/` | Regenerate Prisma client |
| `pnpm prisma db push` | `backend/` | Push schema changes to DB |
| `pnpm dev` | `frontend/` | Start frontend dev server |
| `pnpm build` | `frontend/` | Build frontend for production |
| `pnpm lint` | `frontend/` | Lint frontend code |
| `docker compose up -d` | Root | Start PostgreSQL |

---

## 17. Known Observations & Limitations

1. **VitalsService bypasses extended client**: Uses `this.prisma.patientFlow` and `this.prisma.vitals` instead of `this.prisma.client.xxx`. While not currently a bug (vitals fields are not encrypted), it violates the project convention and could cause issues if encryption is later added to these models.

2. **No DTO validation**: None of the DTOs use `class-validator` decorators or NestJS validation pipes. All validation is done manually in services (e.g., email uniqueness checks, role validation). This means malformed data can reach service methods.

3. **Doctor ID not stored in LabTest/Prescription**: The `orderLabTest()` and `prescribeDrug()` methods receive `doctorId` from the controller but do not store it in the created records. There is no `doctorId` foreign key on the `LabTest` or `Prescription` models.

4. **No automatic DISCHARGED transition**: After pharmacy dispenses medication, the patient returns to `AWAITING_DOCTOR_REVIEW`. There is no automatic path to `DISCHARGED` — a doctor or admin must manually advance the patient using `PUT /queue/advance/:patientId` with `{ newState: "DISCHARGED" }`.

5. **Hardcoded fallback secrets**: Both `JWT_SECRET` and `ENCRYPTION_KEY` have hardcoded fallback values. In production, these must be set via environment variables.

6. **CurrentUser returns full User record**: The `@CurrentUser()` decorator returns the entire Prisma User record including the password hash. While not exposed to the client, it is available in controller code.

7. **Hard deletes for Drugs and LabTestTemplates**: `DELETE` operations permanently remove records from the database. If prescriptions or lab tests reference deleted drugs/templates, the foreign key references could break (though the current schema does not enforce foreign keys to these catalogs).

8. **No pagination**: All list endpoints return complete datasets without pagination. For large hospitals with many patients, this could become a performance issue.

9. **No rate limiting**: The API has no rate limiting, which could expose it to abuse.

10. **CORS configured for localhost only**: The current CORS configuration only allows `http://localhost:3000` and `http://127.0.0.1:3000`. Production deployment would require updating the allowed origins.

11. **WebSocket authentication**: The Socket.IO gateway has `cors: { origin: '*' }` and does not authenticate connections. Any client can connect and receive queue updates.

12. **Pharmacy inventory is simple decrement**: The `dispense()` method decrements inventory by 1 per prescription. There is no transactional safety for concurrent dispensing of the same drug beyond the database transaction.

---

*End of Technical Documentation*