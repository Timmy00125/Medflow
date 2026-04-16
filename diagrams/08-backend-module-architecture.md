# Backend Module Architecture

```mermaid
graph TB
    subgraph GlobalModules["Global Modules (no import needed)"]
        PrismaMod["PrismaModule<br/>@Global<br/><i>PrismaService + client extension</i>"]
        QueueMod["QueueModule<br/>@Global<br/><i>QueueService + QueueGateway</i>"]
        ConfigMod["ConfigModule<br/>@Global<br/><i>Environment variables</i>"]
    end

    subgraph SecurityModule["Security Layer (core/security/)"]
        JwtGuard["JwtAuthGuard<br/><i>Passport JWT strategy trigger</i>"]
        RolesGuardMod["RolesGuard<br/><i>Check user.role vs @Roles()</i>"]
        JwtStrategy["JwtStrategy<br/><i>Validate JWT, load user from DB</i>"]
        RolesDec["@Roles() decorator<br/><i>Set required roles metadata</i>"]
        CurrentUser["@CurrentUser() decorator<br/><i>Extract req.user</i>"]
    end

    subgraph FeatureModules["Feature Modules"]
        UsersMod["UsersModule<br/><i>AuthController + UsersController<br/>UsersService + JwtStrategy</i>"]
        QueueModule2["QueueModule<br/><i>QueueController + QueueGateway<br/>QueueService</i>"]
        ConsultMod["ConsultationModule<br/><i>ConsultationController<br/>ConsultationService</i>"]
        LabMod["LaboratoryModule<br/><i>LaboratoryController<br/>LaboratoryService</i>"]
        PharmMod["PharmacyModule<br/><i>PharmacyController<br/>PharmacyService</i>"]
        DrugMod["DrugModule<br/><i>DrugController<br/>DrugService</i>"]
        TemplateMod["LabTestTemplateModule<br/><i>LabTestTemplateController<br/>LabTestTemplateService</i>"]
        VitalsMod["VitalsModule<br/><i>VitalsController<br/>VitalsService</i>"]
    end

    subgraph Controllers["API Routes"]
        AuthR["/auth<br/>login, signup/patient<br/><i>PUBLIC — No guards</i>"]
        UsersR["/users<br/>staff CRUD, patient creation"]
        QueueR["/queue<br/>triage, doctor, lab, pharmacy queues<br/>advance, assign-doctor"]
        ConsultR["/consultation<br/>notes, lab orders, prescriptions<br/><i>DOCTOR, ADMIN only</i>"]
        LabR["/laboratory<br/>worklist, all tests, upload result<br/><i>LAB_TECH, ADMIN only</i>"]
        PharmR["/pharmacy<br/>worklist, dispense, inventory<br/><i>PHARMACIST, ADMIN</i>"]
        DrugR["/drugs<br/>list, create, delete<br/><i>All roles / ADMIN, PHARMACIST</i>"]
        TemplateR["/lab-test-templates<br/>list, create, delete<br/><i>All roles / ADMIN, LAB_TECH</i>"]
        VitalsR["/vitals<br/>record and retrieve vitals<br/><i>NURSE, ADMIN, DOCTOR</i>"]
    end

    subgraph Database["PostgreSQL via Prisma"]
        UserTable["users"]
        PFTable["patient_flows"]
        CNTable["consultation_notes<br/><i>notes ENCRYPTED</i>"]
        LTTable["lab_tests<br/><i>resultData ENCRYPTED</i>"]
        PrescTable["prescriptions"]
        VitTable["vitals"]
        InvTable["inventories"]
        DrugTable["drugs"]
        LTTTable["lab_test_templates"]
    end

    FeatureModules --> GlobalModules
    SecurityModule -.->|"Applied to all<br/>except AuthController"| FeatureModules
    Controllers --> FeatureModules
    UsersMod --> AuthR
    UsersMod --> UsersR
    QueueModule2 --> QueueR
    ConsultMod --> ConsultR
    LabMod --> LabR
    PharmMod --> PharmR
    DrugMod --> DrugR
    TemplateMod --> TemplateR
    VitalsMod --> VitalsR

    PrismaMod --> Database
    QueueModule2 -->|"broadcasts"| QueueModule2

    style GlobalModules fill:#f0fdf4,stroke:#16a34a
    style SecurityModule fill:#fef3c7,stroke:#d97706
    style FeatureModules fill:#f0f9ff,stroke:#0369a1
    style Controllers fill:#faf5ff,stroke:#7c3aed
    style Database fill:#fefce8,stroke:#a16207
```

## Module Dependency Summary

| Module | Depends On | Exports |
|--------|-----------|---------|
| **PrismaModule** | `@nestjs/config` | `PrismaService` (global) |
| **QueueModule** | `PrismaModule` | `QueueService`, `QueueGateway` (global) |
| **UsersModule** | `PrismaModule`, `JwtModule` | `UsersService` |
| **ConsultationModule** | `PrismaModule`, `QueueModule` | — |
| **LaboratoryModule** | `PrismaModule`, `QueueModule` | — |
| **PharmacyModule** | `PrismaModule`, `QueueModule` | — |
| **DrugModule** | `PrismaModule` | — |
| **LabTestTemplateModule** | `PrismaModule` | — |
| **VitalsModule** | `PrismaModule` | — |