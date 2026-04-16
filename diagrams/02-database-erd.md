# Database Entity-Relationship Diagram

```mermaid
erDiagram
    User {
        String id PK "UUID"
        String email UK
        String password "Argon2 hashed"
        String name
        Role role "ADMIN | DOCTOR | LAB_TECH | PHARMACIST | NURSE | PATIENT"
        DateTime createdAt
        DateTime updatedAt
    }

    PatientFlow {
        String id PK "UUID"
        String patientId FK "Unique — 1:1 with User"
        DepartmentState currentState "AWAITING_TRIAGE by default"
        String assignedDoctorId FK "Nullable"
        String assignedLabId FK "Nullable"
        String assignedPharmId FK "Nullable"
        DateTime queueEnteredAt
        DateTime updatedAt
    }

    ConsultationNote {
        String id PK "UUID"
        String patientId FK
        String doctorId FK
        String notes "PII — Encrypted at rest (AES-256-CBC)"
        Boolean isImmutable "Default false"
        DateTime createdAt
    }

    LabTest {
        String id PK "UUID"
        String patientId FK
        String testName
        String status "PENDING | IN_PROGRESS | COMPLETED"
        String resultData "PII — Encrypted at rest (AES-256-CBC), Nullable"
        String labTechId FK "Nullable"
        DateTime createdAt
        DateTime updatedAt
    }

    Prescription {
        String id PK "UUID"
        String patientId FK
        String drugName
        String dosage
        String status "PENDING | DISPENSED"
        String pharmacistId FK "Nullable"
        DateTime createdAt
        DateTime dispensedAt "Nullable"
    }

    Vitals {
        String id PK "UUID"
        String patientId FK
        String nurseId FK "Nullable"
        Float temperature "Nullable"
        String bloodPressure "Nullable"
        Int heartRate "Nullable"
        Float weight "Nullable"
        Int respiratoryRate "Nullable"
        Int oxygenSaturation "Nullable"
        String notes "Nullable"
        DateTime createdAt
    }

    Inventory {
        String id PK "UUID"
        String drugName UK
        Int stock "Default 0"
        DateTime updatedAt
    }

    Drug {
        String id PK "UUID"
        String name UK
        String description "Nullable"
        Boolean isDefault "Default false"
        DateTime createdAt
        DateTime updatedAt
    }

    LabTestTemplate {
        String id PK "UUID"
        String name UK
        String description "Nullable"
        String category "Nullable"
        Boolean isDefault "Default false"
        DateTime createdAt
        DateTime updatedAt
    }

    User ||--|| PatientFlow : "patient (1:1)"
    User ||--o{ ConsultationNote : "doctor"
    User ||--o{ ConsultationNote : "patient"
    User ||--o{ LabTest : "labTech"
    User ||--o{ LabTest : "patient"
    User ||--o{ Prescription : "pharmacist"
    User ||--o{ Prescription : "patient"
    User ||--o{ Vitals : "nurse"
    User ||--o{ Vitals : "patient"
```

## Encryption Notes

Fields marked **"PII — Encrypted at rest"** are automatically encrypted/decrypted by the Prisma Client Extension using AES-256-CBC:

- **ConsultationNote.notes** — Doctor's clinical notes are encrypted before storage and decrypted on read
- **LabTest.resultData** — Lab test results are encrypted before storage and decrypted on read

The encryption uses a random 16-byte IV per write, stored in `iv:ciphertext` format. The encryption key comes from `ENCRYPTION_KEY` env var (with a hardcoded fallback).