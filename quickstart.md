# MedFlow Quick Start

## What This System Is
MedFlow is a role-based telemedicine workflow platform.
It manages a patient through clinical stages using queues and state transitions:

- `AWAITING_TRIAGE`
- `AWAITING_DOCTOR`
- `AWAITING_LAB`
- `AWAITING_DOCTOR_REVIEW`
- `AWAITING_PHARMACY`
- `DISCHARGED`

Real-time updates are sent over Socket.IO so dashboards refresh when queue state changes.

---

## 1. Run The System Locally

### Prerequisites
- Node.js (LTS recommended)
- `pnpm`
- Docker + Docker Compose

### Start PostgreSQL
From project root:

```bash
docker compose up -d
```

### Backend setup

```bash
cd backend
pnpm install
```

Create `backend/.env` with:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/telemedicine?schema=public
JWT_SECRET=SUPER_SECRET_KEY
# Optional seed overrides
# ADMIN_EMAIL=admin@telemed.com
# ADMIN_PASSWORD=AdminPassword123!
```

Apply schema + seed admin:

```bash
pnpm prisma generate
pnpm prisma db push
pnpm prisma db seed
pnpm run start:dev
```

Backend runs on `http://localhost:3001`.

### Frontend setup
In a second terminal:

```bash
cd frontend
pnpm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Start frontend:

```bash
pnpm dev
```

Frontend runs on `http://localhost:3000`.

---

## 2. Default Login Credentials

### Super Admin (seeded)
- Email: `admin@telemed.com`
- Password: `AdminPassword123!`

If admin already exists, reseeding will skip creating another one unless you reset DB.

---

## 3. How Accounts Are Created

### Public signup
- Patients can self-register at `/signup`
- Uses backend endpoint: `POST /auth/signup/patient`

### Staff signup
- There is no public staff signup.
- Staff (`DOCTOR`, `NURSE`, `LAB_TECH`, `PHARMACIST`, `ADMIN`) must be created by an Admin.
- Admin does this from dashboard or endpoint: `POST /users/staff`

### Patient registration by staff
- Admin/Nurse/Doctor can also register patients from the admin-style flow via: `POST /users/patient`

---

## 4. Who Can Do What (Role Permissions)

### ADMIN
- Full operational visibility across queues
- Create staff accounts
- Register patients
- Access doctor/lab/pharmacy queue views
- Advance patient state (same endpoint family used by triage/doctor workflows)

### NURSE
- Access triage queue
- Register patients
- Advance patient from triage toward doctor
- Uses admin-style dashboard navigation in this UI

### DOCTOR
- Access doctor queue (`AWAITING_DOCTOR`, `AWAITING_DOCTOR_REVIEW`)
- Write consultation notes
- Order lab tests
- Prescribe medications
- Can discharge patient directly (dashboard action)
- Can view pharmacy inventory

### LAB_TECH
- Access lab worklist
- Upload test results
- Uploading result automatically moves patient to `AWAITING_DOCTOR_REVIEW`

### PHARMACIST
- Access pharmacy worklist
- Dispense prescriptions
- Manage inventory (add stock, view stock)
- Dispensing automatically moves patient to `DISCHARGED`

### PATIENT
- Access patient dashboard (`/dashboard/patient`)
- View their own current queue state in real time
- See progress through the visit flow

---

## 5. Patient Journey (End-to-End Flow)

## Standard path with lab
1. Patient is created (`/signup` or staff registration)
2. System creates `PatientFlow` with state `AWAITING_TRIAGE`
3. Triage/Admin advances patient to `AWAITING_DOCTOR` (optionally assigning doctor)
4. Doctor consultation:
   - Write note (does not change state), and/or
   - Order lab test -> state changes to `AWAITING_LAB`
5. Lab uploads result -> state changes to `AWAITING_DOCTOR_REVIEW`
6. Doctor reviews and prescribes -> state changes to `AWAITING_PHARMACY`
7. Pharmacist dispenses medication -> state changes to `DISCHARGED`

## Alternative path without lab
- Doctor can prescribe directly from doctor queue -> `AWAITING_PHARMACY` -> dispense -> `DISCHARGED`.

## Direct discharge path
- Doctor can discharge directly from doctor dashboard when clinically appropriate.

---

## 6. Main Dashboard Routes
- Login: `/login`
- Patient Signup: `/signup`
- Admin: `/dashboard/admin`
- Doctor: `/dashboard/doctor`
- Laboratory: `/dashboard/laboratory`
- Pharmacy: `/dashboard/pharmacy`
- Patient: `/dashboard/patient`

Role-based redirect happens automatically after login.

---

## 7. Common First-Time Checklist
1. Log in as Super Admin.
2. Create at least one user for each operational role:
   - Doctor
   - Lab Tech
   - Pharmacist
   - (Optional) Nurse
3. Add inventory items before testing pharmacy dispensing.
4. Register a patient and run a full workflow:
   - Triage -> Doctor -> Lab -> Doctor Review -> Pharmacy -> Discharged

---

## 8. Troubleshooting

### "Invalid credentials"
- Confirm exact email/password used when creating that user.
- Ensure backend is running and `NEXT_PUBLIC_API_URL` points to it.

### Admin cannot login after reset
- Re-run seed:

```bash
cd backend
pnpm prisma db seed
```

### Need a clean slate
Warning: this removes local DB data.

```bash
docker compose down -v
docker compose up -d
cd backend
pnpm prisma db push
pnpm prisma db seed
```
