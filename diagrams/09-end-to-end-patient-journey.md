# End-to-End Patient Journey (Happy Path)

```mermaid
sequenceDiagram
    actor Patient as Patient
    actor Nurse as Nurse
    actor Doctor as Doctor
    actor LabTech as Lab Tech
    actor Pharmacist as Pharmacist
    participant FE as Frontend
    participant API as NestJS API
    participant WS as WebSocket
    participant DB as PostgreSQL

    rect rgb(254, 226, 226)
        Note over Patient,DB: 1. REGISTRATION & INTAKE
        Patient->>FE: Sign up at /signup
        FE->>API: POST /auth/signup/patient
        API->>DB: Create User (role: PATIENT)
        API->>DB: Create PatientFlow (AWAITING_TRIAGE)
        API-->>FE: 201 { user }
        Patient->>FE: Login at /login
        FE->>API: POST /auth/login
        API-->>FE: 200 { access_token, user }
    end

    rect rgb(220, 252, 231)
        Note over Nurse,DB: 2. TRIAGE
        Nurse->>FE: Login → /dashboard/nurse
        FE->>API: GET /queue/triage
        API-->>FE: Patient list (AWAITING_TRIAGE)
        Nurse->>FE: Record vitals
        FE->>API: POST /vitals/:patientId { temp, BP, HR, ... }
        API->>DB: Create Vitals record
        Nurse->>FE: Assign doctor & advance
        FE->>API: POST /queue/assign-doctor/:patientId { doctorId }
        API->>DB: UPDATE PatientFlow SET assignedDoctorId
        FE->>API: PUT /queue/advance/:patientId { newState: "AWAITING_DOCTOR" }
        API->>DB: UPDATE PatientFlow SET currentState = 'AWAITING_DOCTOR'
        API->>WS: broadcast queueUpdate + patientUpdate
        WS-->>FE: All dashboards auto-refresh
    end

    rect rgb(254, 243, 199)
        Note over Doctor,DB: 3. CONSULTATION
        Doctor->>FE: Login → /dashboard/doctor
        FE->>API: GET /queue/doctor
        API-->>FE: Assigned patients (AWAITING_DOCTOR)
        Doctor->>FE: Open patient, write note
        FE->>API: POST /consultation/:patientId/note { notes }
        API->>DB: Create ConsultationNote (notes ENCRYPTED)
        Doctor->>FE: Order lab test
        FE->>API: POST /consultation/:patientId/lab { testName }
        API->>DB: CREATE LabTest (PENDING)
        API->>DB: UPDATE PatientFlow → AWAITING_LAB
        API->>WS: broadcast queueUpdate + patientUpdate
    end

    rect rgb(239, 246, 255)
        Note over LabTech,DB: 4. LAB WORK
        LabTech->>FE: Login → /dashboard/laboratory
        FE->>API: GET /laboratory/worklist
        API-->>FE: Pending lab tests
        LabTech->>FE: Upload results
        FE->>API: POST /laboratory/:testId/result { resultData }
        API->>DB: UPDATE LabTest (resultData ENCRYPTED, status: COMPLETED)
        API->>DB: UPDATE PatientFlow → AWAITING_DOCTOR_REVIEW
        API->>WS: broadcast queueUpdate + patientUpdate
    end

    rect rgb(254, 243, 199)
        Note over Doctor,DB: 5. REVIEW & PRESCRIBE
        Doctor->>FE: Review lab results
        FE->>API: GET /consultation/:patientId/lab-results
        API-->>FE: Lab test results (auto-DECRYPTED)
        Doctor->>FE: Prescribe medication
        FE->>API: POST /consultation/:patientId/prescription { drugName, dosage }
        API->>DB: CREATE Prescription (PENDING)
        API->>DB: UPDATE PatientFlow → AWAITING_PHARMACY
        API->>WS: broadcast queueUpdate + patientUpdate
    end

    rect rgb(255, 237, 213)
        Note over Pharmacist,DB: 6. DISPENSING & DISCHARGE
        Pharmacist->>FE: Login → /dashboard/pharmacy
        FE->>API: GET /pharmacy/worklist
        API-->>FE: Pending prescriptions
        Pharmacist->>FE: Dispense medication
        FE->>API: POST /pharmacy/:rxId/dispense
        API->>DB: UPDATE Prescription (status: DISPENSED, dispensedAt)
        API->>DB: UPDATE PatientFlow → DISCHARGED
        API->>WS: broadcast queueUpdate + patientUpdate
    end

    rect rgb(220, 252, 231)
        Note over Patient,DB: 7. PATIENT VIEWS STATUS
        Patient->>FE: /dashboard/patient
        FE->>API: GET /queue/patient/:id
        API-->>FE: { currentState: "DISCHARGED" }
        FE->>Patient: Shows "Discharged" status
    end
```

## Journey Summary

This diagram shows the complete happy path of a patient through the MedFlow system:

1. **Registration** → Patient signs up, system creates User + PatientFlow (AWAITING_TRIAGE)
2. **Triage** → Nurse records vitals, assigns doctor, advances to AWAITING_DOCTOR
3. **Consultation** → Doctor writes notes (encrypted), orders lab test, advances to AWAITING_LAB
4. **Lab Work** → Lab tech uploads results (encrypted), advances to AWAITING_DOCTOR_REVIEW
5. **Review & Prescribe** → Doctor reviews results, prescribes medication, advances to AWAITING_PHARMACY
6. **Dispensing** → Pharmacist dispenses medication, advances to DISCHARGED
7. **Patient View** → Patient checks their real-time status via WebSocket updates

Each state transition triggers a WebSocket broadcast so all connected clients auto-refresh.