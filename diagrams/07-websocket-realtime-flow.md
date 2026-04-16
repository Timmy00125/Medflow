# Real-Time WebSocket Flow

```mermaid
sequenceDiagram
    actor Nurse as Nurse Client
    actor Doctor as Doctor Client
    actor LabTech as Lab Tech Client
    actor Pharmacist as Pharmacist Client
    participant Gateway as QueueGateway<br/>(WebSocket Server)
    participant Service as QueueService
    participant DB as PostgreSQL

    Note over Nurse,Gateway: Initial Connection (all clients on page load)
    Nurse->>Gateway: socket.connect()
    Doctor->>Gateway: socket.connect()
    LabTech->>Gateway: socket.connect()
    Pharmacist->>Gateway: socket.connect()

    rect rgb(220, 252, 231)
        Note over Nurse,DB: NURSE TRIAGES PATIENT
        Nurse->>+Service: PUT /queue/advance/:patientId<br/>{ newState: "AWAITING_DOCTOR" }
        Service->>+DB: UPDATE PatientFlow SET currentState = 'AWAITING_DOCTOR'
        DB-->>-Service: Updated record
        Service->>+Gateway: broadcastQueueUpdate()<br/>broadcastPatientSpecificUpdate(patientId)
        Gateway-->>Nurse: emit("queueUpdate", { timestamp })
        Gateway-->>Doctor: emit("queueUpdate", { timestamp })
        Gateway-->>LabTech: emit("queueUpdate", { timestamp })
        Gateway-->>Pharmacist: emit("queueUpdate", { timestamp })
        Gateway-->>Nurse: emit("patientUpdate-{id}", { timestamp })
        Gateway-->>Doctor: emit("patientUpdate-{id}", { timestamp })
        Note over Doctor: Doctor desk auto-refreshes<br/>new patient appears
    end

    rect rgb(254, 243, 199)
        Note over Doctor,DB: DOCTOR ORDERS LAB TEST
        Doctor->>+Service: POST /consultation/:patientId/lab<br/>{ testName: "Complete Blood Count" }
        Service->>+DB: CREATE LabTest + UPDATE PatientFlow
        DB-->>-Service: Created/Updated records
        Service->>+Gateway: broadcastQueueUpdate()<br/>broadcastPatientSpecificUpdate(patientId)
        Gateway-->>Nurse: emit("queueUpdate", { timestamp })
        Gateway-->>Doctor: emit("queueUpdate", { timestamp })
        Gateway-->>LabTech: emit("queueUpdate", { timestamp })
        Note over LabTech: Lab worklist auto-updates
        Gateway-->>Pharmacist: emit("queueUpdate", { timestamp })
    end

    rect rgb(239, 246, 255)
        Note over LabTech,DB: LAB TECH UPLOADS RESULTS
        LabTech->>+Service: POST /laboratory/:testId/result<br/>{ resultData: "..." }
        Service->>+DB: UPDATE LabTest + UPDATE PatientFlow
        DB-->>-Service: Updated records
        Service->>+Gateway: broadcastQueueUpdate()<br/>broadcastPatientSpecificUpdate(patientId)
        Gateway-->>Nurse: emit("queueUpdate", { timestamp })
        Gateway-->>Doctor: emit("queueUpdate", { timestamp })
        Note over Doctor: Doctor review list updates
        Gateway-->>LabTech: emit("queueUpdate", { timestamp })
        Gateway-->>Pharmacist: emit("queueUpdate", { timestamp })
    end

    rect rgb(255, 237, 213)
        Note over Pharmacist,DB: PHARMACIST DISPENSES MEDICATION
        Pharmacist->>+Service: POST /pharmacy/:rxId/dispense
        Service->>+DB: UPDATE Prescription + UPDATE PatientFlow
        DB-->>-Service: Updated records
        Service->>+Gateway: broadcastQueueUpdate()<br/>broadcastPatientSpecificUpdate(patientId)
        Gateway-->>Nurse: emit("queueUpdate", { timestamp })
        Gateway-->>Doctor: emit("queueUpdate", { timestamp })
        Gateway-->>LabTech: emit("queueUpdate", { timestamp })
        Gateway-->>Pharmacist: emit("queueUpdate", { timestamp })
    end
```

## WebSocket Architecture

| Component | Detail |
|-----------|--------|
| **Library** | Socket.IO (server + client) |
| **Server** | `QueueGateway` — `@WebSocketGateway({ cors: { origin: '*' } })` |
| **Client** | `useSocket(patientId?)` hook — connects to `NEXT_PUBLIC_WS_URL` or `localhost:3001` |
| **Events** | `queueUpdate` (broadcast to all clients), `patientUpdate-{id}` (per-patient) |
| **Payload** | `{ timestamp: string }` — clients use timestamp to trigger `useEffect` re-fetch |
| **Reconnection** | Auto-reconnect up to 10 attempts, 1s delay |
| **Trigger** | `QueueService` calls gateway broadcast after any state-changing operation |
| **Client pattern** | Pages watch `lastUpdate` from `useSocket()` and re-fetch in `useEffect` |