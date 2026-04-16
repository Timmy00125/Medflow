# System Architecture Overview

```mermaid
graph TB
    subgraph Client["Frontend — Next.js 15 App Router"]
        Browser["Browser"]
        SPA["React SPA<br/>Port 3000"]
        AuthCtx["AuthContext<br/>(JWT in localStorage)"]
        Pages["Dashboard Pages<br/>Admin • Doctor • Nurse<br/>Lab Tech • Pharmacist • Patient"]
        SocketClient["Socket.IO Client<br/>(useSocket hook)"]
    end

    subgraph Server["Backend — NestJS API"]
        Gateway["NestJS Server<br/>Port 3001"]
        AuthCtrl["AuthController<br/>/auth/login, /auth/signup/patient<br/>(Public — No Guards)"]
        Guards["JwtAuthGuard + RolesGuard<br/>(Applied to all other controllers)"]
        Controllers["Feature Controllers<br/>Users • Queue • Consultation<br/>Laboratory • Pharmacy • Vitals<br/>Drugs • LabTestTemplates"]
        Services["Feature Services<br/>Business Logic Layer"]
        WSGateway["QueueGateway<br/>(WebSocket — Socket.IO)"]
        PrismaExt["PrismaService<br/>+ Client Extension<br/>(AES-256-CBC Encryption)"]
    end

    subgraph DB["PostgreSQL"]
        PG["Database<br/>(Prisma Migrations)"]
    end

    Browser --> SPA
    SPA --> AuthCtx
    SPA --> Pages
    Pages -->|"HTTP + Bearer Token"| Gateway
    Pages -->|"WebSocket"| SocketClient
    SocketClient -->|"connect / listen"| WSGateway
    Gateway --> AuthCtrl
    Gateway --> Guards
    Guards --> Controllers
    Controllers --> Services
    Services --> PrismaExt
    Services --> WSGateway
    PrismaExt --> PG

    style Client fill:#f0f9ff,stroke:#0369a1,stroke-width:2px
    style Server fill:#fef3c7,stroke:#d97706,stroke-width:2px
    style DB fill:#f0fdf4,stroke:#16a34a,stroke-width:2px
```

## Key Points

- **Frontend** is a Next.js 15 SPA (only `layout.tsx` is a Server Component)
- **Backend** is a NestJS monolith with 8 feature modules
- **Auth** uses JWT (Bearer token) with Passport strategy — all endpoints except `/auth/*` are guarded
- **Real-time** updates use Socket.IO (`queueUpdate` and `patientUpdate-{id}` events)
- **Prisma Client Extension** encrypts sensitive fields (`ConsultationNote.notes`, `LabTest.resultData`) at rest with AES-256-CBC
- **PostgreSQL** stores all persistent data with UUID primary keys