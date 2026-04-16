# Frontend Routing & Page Structure

```mermaid
graph TD
    Root["/<br/>Redirects to role dashboard<br/>or /login"]
    Login["/login<br/>Login Page"]
    Signup["/signup<br/>Patient Signup"]
    DashRoot["/dashboard<br/>Redirects by role"]
    DashLayout["DashboardLayout<br/>AuthGuard + Sidebar"]

    subgraph Admin["Admin Role"]
        AdminHome["/dashboard/admin<br/>Overview Stats"]
        AdminPatients["/dashboard/admin/patients<br/>Patient List"]
        AdminPatientDetail["/dashboard/admin/patients/:id<br/>Patient Detail"]
        AdminDoctors["/dashboard/admin/doctors<br/>Doctor List"]
        AdminDoctorDetail["/dashboard/admin/doctors/:id<br/>Doctor Detail"]
        AdminNurses["/dashboard/admin/nurses<br/>Nurse List"]
        AdminNurseDetail["/dashboard/admin/nurses/:id<br/>Nurse Detail"]
        AdminLab["/dashboard/admin/laboratory<br/>All Lab Tests"]
        AdminPharmacy["/dashboard/admin/pharmacy<br/>All Prescriptions"]
    end

    subgraph Doctor["Doctor Role"]
        DoctorDesk["/dashboard/doctor<br/>Doctor Consultation Desk"]
        CheckPatients["/dashboard/check-patients<br/>Patient Lookup"]
        History["/dashboard/history<br/>Staff Action History"]
    end

    subgraph Nurse["Nurse Role"]
        NurseDesk["/dashboard/nurse<br/>Nurse Triage Desk"]
        NurseCheck["/dashboard/check-patients<br/>Patient Lookup"]
        NurseHistory["/dashboard/history<br/>Staff Action History"]
    end

    subgraph LabTech["Lab Tech Role"]
        LabDesk["/dashboard/laboratory<br/>Lab Work Desk"]
        LabHistory["/dashboard/history<br/>Staff Action History"]
    end

    subgraph Pharmacist["Pharmacist Role"]
        PharmDesk["/dashboard/pharmacy<br/>Pharmacy Dispensing Desk"]
        PharmHistory["/dashboard/history<br/>Staff Action History"]
    end

    subgraph Patient["Patient Role"]
        PatientStatus["/dashboard/patient<br/>My Status View"]
    end

    Root -->|Unauthenticated| Login
    Root -->|Authenticated| DashRoot
    Login -->|Submit| DashRoot
    Signup -->|Register| Login
    DashRoot -->|Redirect by role| DashLayout
    DashLayout --> Admin
    DashLayout --> Doctor
    DashLayout --> Nurse
    DashLayout --> LabTech
    DashLayout --> Pharmacist
    DashLayout --> Patient

    AdminHome --> AdminPatients
    AdminPatients --> AdminPatientDetail
    AdminHome --> AdminDoctors
    AdminDoctors --> AdminDoctorDetail
    AdminHome --> AdminNurses
    AdminNurses --> AdminNurseDetail

    style Root fill:#f0f9ff,stroke:#0369a1
    style Login fill:#fef3c7,stroke:#d97706
    style Signup fill:#fef3c7,stroke:#d97706
    style DashLayout fill:#f0fdf4,stroke:#16a34a
    style Admin fill:#faf5ff,stroke:#7c3aed
    style Doctor fill:#fef3c7,stroke:#d97706
    style Nurse fill:#f0fdf4,stroke:#16a34a
    style LabTech fill:#eff6ff,stroke:#2563eb
    style Pharmacist fill:#fff7ed,stroke:#ea580c
    style Patient fill:#fdf2f8,stroke:#db2777
```

## Role-to-Dashboard Mapping

| Role | Default Route | Accessible Pages |
|------|--------------|-----------------|
| **ADMIN** | `/dashboard/admin` | All admin pages + history |
| **DOCTOR** | `/dashboard/doctor` | Doctor desk, check-patients, history |
| **NURSE** | `/dashboard/nurse` | Nurse desk, check-patients, history |
| **LAB_TECH** | `/dashboard/laboratory` | Lab desk, history |
| **PHARMACIST** | `/dashboard/pharmacy` | Pharmacy desk, history |
| **PATIENT** | `/dashboard/patient` | My status only |