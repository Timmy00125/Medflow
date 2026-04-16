# API Request Flow (Guard & Middleware Pipeline)

```mermaid
flowchart TD
    Request["Incoming HTTP Request"] --> CORS{CORS Check?}
    CORS -->|Origin not allowed| Reject1["403 Forbidden"]
    CORS -->|Origin allowed| AuthCheck{Has Authorization header?}

    AuthCheck -->|No| Reject2["401 Unauthorized"]
    AuthCheck -->|Yes| JwtVerify["JwtAuthGuard<br/>Passport verifies JWT"]
    JwtVerify -->|Invalid/expired| Reject3["401 Unauthorized"]
    JwtVerify -->|Valid| DbLookup["JwtStrategy.validate()<br/>Look up user in DB<br/>req.user = User object"]
    DbLookup -->|User not found| Reject4["401 Unauthorized"]
    DbLookup -->|User found| RolesCheck{"RolesGuard<br/>@Roles() decorator?"}

    RolesCheck -->|No @Roles| AllowAll["✅ Allow any<br/>authenticated user"]
    RolesCheck -->|Has @Roles| RoleMatch{"user.role ∈<br/>requiredRoles?"}
    RoleMatch -->|No| Reject5["403 Forbidden"]
    RoleMatch -->|Yes| Allowed["✅ Role authorized"]

    AllowAll --> Controller["Controller Method<br/>Can use @CurrentUser()"]
    Allowed --> Controller

    Controller --> Service["Service Layer<br/>Business logic"]
    Service --> Prisma{"Prisma Client<br/>Extension?"}

    Prisma -->|Encrypted field read| Decrypt["AES-256-CBC<br/>Auto-decrypt"]
    Prisma -->|Encrypted field write| Encrypt["AES-256-CBC<br/>Auto-encrypt"]
    Prisma -->|Normal field| Passthrough["Direct DB access"]

    Decrypt --> DB["PostgreSQL"]
    Encrypt --> DB
    Passthrough --> DB

    DB --> Response["JSON Response<br/>200 / 201"]
    Controller --> WsBroadcast{"State-changing<br/>action?"}
    WsBroadcast -->|Yes| EmitWs["QueueGateway.broadcast()<br/>queueUpdate + patientUpdate-{id}"]
    WsBroadcast -->|No| SkipWs["Skip WebSocket"]
    EmitWs --> Response
    SkipWs --> Response

    style Request fill:#f0f9ff,stroke:#0369a1
    style Reject1 fill:#fef2f2,stroke:#dc2626
    style Reject2 fill:#fef2f2,stroke:#dc2626
    style Reject3 fill:#fef2f2,stroke:#dc2626
    style Reject4 fill:#fef2f2,stroke:#dc2626
    style Reject5 fill:#fef2f2,stroke:#dc2626
    style Allowed fill:#f0fdf4,stroke:#16a34a
    style AllowAll fill:#f0fdf4,stroke:#16a34a
    style DB fill:#fefce8,stroke:#a16207
```

## Pipeline Summary

1. **CORS** — Only `localhost:3000` and `127.0.0.1:3000` allowed (with credentials)
2. **JwtAuthGuard** — Extracts Bearer token, validates via Passport JWT strategy
3. **JwtStrategy.validate()** — Looks up full user from DB (includes encrypted fields)
4. **RolesGuard** — Checks `req.user.role` against `@Roles()` metadata
5. **@CurrentUser()** — Custom decorator making `req.user` available in handler
6. **Service → Prisma** — All DB access uses `this.prisma.client.xxx` (with encryption extension)
7. **QueueGateway** — After state-changing operations, broadcasts WebSocket events to connected clients