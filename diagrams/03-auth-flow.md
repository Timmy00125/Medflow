# Authentication & Authorization Flow

```mermaid
sequenceDiagram
    actor Client as Browser (Frontend)
    participant API as NestJS API
    participant Strategy as JwtStrategy
    participant AuthGuard as JwtAuthGuard
    participant RolesGuard as RolesGuard
    participant Controller as Feature Controller
    participant Service as Service Layer
    participant DB as PostgreSQL

    rect rgb(220, 252, 231)
        Note over Client,DB: LOGIN FLOW (Public — No Auth Required)
        Client->>+API: POST /auth/login { email, password }
        API->>+Service: UsersService.login(email, password)
        Service->>+DB: Find user by email
        DB-->>-Service: User record
        Service->>Service: Argon2 verify(password, hash)
        Service->>Service: jwt.sign({ sub: user.id, email })
        Service-->>-API: { access_token, user }
        API-->>-Client: 200 { access_token, user }
        Client->>Client: Store token in localStorage<br/>Store user in localStorage<br/>Redirect to role dashboard
    end

    rect rgb(254, 243, 199)
        Note over Client,DB: AUTHENTICATED REQUEST FLOW
        Client->>+API: GET /queue/triage<br/>Authorization: Bearer <token>
        API->>+AuthGuard: Validate JWT
        AuthGuard->>+Strategy: Extract & verify token
        Strategy->>Strategy: jwt.verify(token, JWT_SECRET)
        Strategy->>+DB: Find user by payload.sub
        DB-->>-Strategy: Full User record
        Strategy-->>-AuthGuard: req.user = User object
        AuthGuard-->>-API: Authenticated ✓

        API->>+RolesGuard: Check @Roles() metadata
        RolesGuard->>RolesGuard: Get required roles from decorator
        RolesGuard->>RolesGuard: Check req.user.role ∈ requiredRoles
        RolesGuard-->>-API: Authorized ✓ (or 403 Forbidden)

        API->>+Controller: Route handler
        Controller->>+Service: Business logic
        Service->>+DB: Prisma query (this.prisma.client.xxx)
        DB-->>-Service: Data
        Service-->>-Controller: Result
        Controller-->>-Client: 200 JSON response
    end

    rect rgb(254, 226, 226)
        Note over Client,API: UNAUTHORIZED / FORBIDDEN
        Client->>API: GET /queue/triage (no token)
        API->>AuthGuard: Validate JWT
        AuthGuard-->>API: 401 Unauthorized
        API-->>Client: 401 { message: "Unauthorized" }

        Client->>API: GET /queue/triage (PATIENT token)
        API->>RolesGuard: Check @Roles('ADMIN', 'NURSE')
        RolesGuard-->>API: 403 Forbidden
        API-->>Client: 403 { message: "Forbidden resource" }
    end
```

## Auth Details

| Aspect | Implementation |
|--------|---------------|
| **Password hashing** | Argon2 (`argon2.verify`) |
| **Token format** | JWT (`{ sub: userId, email }`) |
| **Token expiry** | 1 day (`expiresIn: '1d'`) |
| **Token storage** | `localStorage` on client |
| **Token transmission** | `Authorization: Bearer <token>` header |
| **JWT secret** | `JWT_SECRET` env var (fallback: `"SUPER_SECRET_KEY"`) |
| **Public routes** | `POST /auth/login`, `POST /auth/signup/patient` |
| **Guard order** | `JwtAuthGuard` → `RolesGuard` (on every protected controller) |
| **Role enum** | `ADMIN`, `DOCTOR`, `LAB_TECH`, `PHARMACIST`, `NURSE`, `PATIENT` |
| **@CurrentUser()** | Custom param decorator → extracts `req.user` (full User object) |