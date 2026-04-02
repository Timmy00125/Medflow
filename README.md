# MedFlow Telemedicine Platform

MedFlow is a comprehensive, role-based telemedicine workflow platform designed to manage patient care through clinical stages using real-time queues and state transitions. From registration to discharge, MedFlow ensures a seamless experience for both patients and healthcare providers.

## 🌟 Key Features

- **Role-Based Workflows**: Tailored dashboards for Admin, Doctor, Nurse, Lab Tech, Pharmacist, and Patient.
- **Real-Time Queue Management**: Patient states are updated in real-time across all departments using Socket.IO.
- **Clinical Management**: Integrated consultation notes, lab test ordering, result uploads, and prescription management.
- **Inventory System**: Pharmacy inventory tracking with safe concurrent dispensing.
- **Modern UI**: Data-dense, glassmorphism-inspired interface built with Next.js and Tailwind CSS.
- **Security**: RBAC (Role-Based Access Control) and PII protection.

---

## 🛠️ Tech Stack

### Backend
- **Framework**: [NestJS](https://nestjs.com/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Database**: PostgreSQL (Dockerized)
- **Real-time**: Socket.IO
- **Auth**: JWT with Argon2 password hashing

### Frontend
- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Styling**: Tailwind CSS & [shadcn/ui](https://ui.shadcn.com/)
- **State Management**: React Context & Hooks
- **Real-time**: Socket.IO Client

---

## 📂 Project Structure

```text
.
├── backend/            # NestJS API & Prisma Schema
├── frontend/           # Next.js Application
├── docker-compose.yml  # Infrastructure (PostgreSQL)
└── quickstart.md       # Detailed setup guide
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (LTS recommended)
- `pnpm`
- Docker + Docker Compose

### 1. Start Infrastructure
Run PostgreSQL from the project root:
```bash
docker compose up -d
```

### 2. Backend Setup
```bash
cd backend
pnpm install

# Create .env with DATABASE_URL and JWT_SECRET
# Apply schema, generate client and seed data
pnpm prisma generate
pnpm prisma db push
pnpm prisma db seed

# Start development server
pnpm run start:dev
```
*Backend runs on `http://localhost:3001`.*

### 3. Frontend Setup
```bash
cd ../frontend
pnpm install

# Create .env.local with NEXT_PUBLIC_API_URL=http://localhost:3001
pnpm dev
```
*Frontend runs on `http://localhost:3000`.*

---

## 🔐 Default Credentials

### Super Admin (Seeded)
- **Email**: `admin@telemed.com`
- **Password**: `AdminPassword123!`

---

## 🔄 Patient Journey (State Machine)

MedFlow manages patients through the following states:

1. `AWAITING_TRIAGE`: Initial state after registration.
2. `AWAITING_DOCTOR`: Moved by Triage/Admin for consultation.
3. `AWAITING_LAB`: Set by Doctor when ordering tests.
4. `AWAITING_DOCTOR_REVIEW`: Automatic update after Lab uploads results.
5. `AWAITING_PHARMACY`: Set by Doctor after prescribing medication.
6. `DISCHARGED`: Final state after Pharmacy dispenses medication.

---

## 👥 Role Permissions

| Role | Primary Responsibilities |
| :--- | :--- |
| **Admin** | Staff management, operational overview, full queue access. |
| **Nurse** | Patient registration, triage management. |
| **Doctor** | Consultations, lab orders, prescriptions, direct discharge. |
| **Lab Tech** | Worklist management, test result uploads. |
| **Pharmacist** | Prescription dispensing, inventory management. |
| **Patient** | View personal real-time status and medical history. |

---

## 🛠️ Troubleshooting

- **Database Connection**: Ensure Docker is running and the `DATABASE_URL` in `backend/.env` matches your docker-compose config.
- **Real-time Updates**: Verify the backend is running; Socket.IO depends on an active backend connection.
- **Login Issues**: Ensure `NEXT_PUBLIC_API_URL` is correctly set in the frontend environment variables.

For a more detailed guide, see [quickstart.md](./quickstart.md).
