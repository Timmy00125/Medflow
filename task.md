# Task List: Modular Telemedicine Platform

## 1. Setup Phase
- [x] Initialize Next.js project in `frontend` using pnpm.
- [x] Install and configure Tailwind CSS + shadcn/ui in `frontend`.
- [x] Initialize NestJS project in `backend` using pnpm.
- [x] Configure `docker-compose.yml` for PostgreSQL.
- [x] Setup Prisma ORM in `backend` and connect to Database.

## 2. Backend Base & Security
- [x] Define Prisma Schema: Users (staff & patients), PatientFlowState.
- [x] Implement Prisma middleware/extension for PII column encryption (at-rest security).
- [x] Seed script for initial Super Admin creation.
- [x] Setup Users Module: Authentication (Argon2), JWT, and RBAC guards.
- [x] Setup Staff Management endpoints (Super Admin creates Doc, Lab, Pharm, Nurse).

## 3. Core Engine (Backend Domains)
- [x] Queue Module: State Machine for patient flow.
- [x] Queue Gateway (WebSockets): Real-time broadcast of queue state to specific departments.
- [x] Consultation Module: Clinical notes, ordering labs, prescribing drugs.
- [x] Laboratory Module: Worklists, test result uploads.
- [x] Pharmacy Module: Inventory tracking, safe concurrent dispensing within DB transactions.

## 4. Frontend Application (Dashboards)
- [x] Setup Authentication Context & Login page.
- [x] Patient Dashboard: Real-time UI showing their current state (assigned doctor, ordered labs, medicine to collect).
- [x] Admin Dashboard: Staff creation forms and system overview.
- [x] Doctor Dashboard: Consultation queue, patient note entry, ordering actions.
- [x] Laboratory Dashboard: Worklist queue and result upload forms.
- [x] Pharmacy Dashboard: Prescription queue and inventory dispensing interactions.
- [x] Integrate WebSocket client to listen for Queue changes across all dashboards.

## 5. Polish and Verification
- [x] Validate multi-department user flow (Patient -> Triage -> Doctor -> Lab -> Doctor -> Pharmacy).
- [x] Review UI Aesthetics: Ensure clean, data-dense, dark mode compatible glassmorphism aesthetics as requested.
