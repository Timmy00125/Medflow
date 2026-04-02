# Improvements to Add

Based on an initial codebase investigation, here are several areas for improvement that should be addressed:

## 1. Security & Privacy
*   **Encrypt Sensitive PII Data**: Sensitive Patient Information (PII) such as `ConsultationNote.notes` and `LabTest.resultData` are currently stored as plain strings in Prisma (`backend/prisma/schema.prisma`). These should be encrypted at rest.
*   **CORS Configuration**: CORS origins in `backend/src/main.ts` are hardcoded to `localhost`, which will break in production. These should be managed via environment variables.
*   **Role-Based Access Control (RBAC)**: While the `Role` enum is present in the database schema, we need to verify its consistent implementation across all controllers to ensure secure access.
*   **Password Hashing Auditing**: Audit the `UsersService` to ensure passwords are properly hashed before storing in the database.

## 2. Error Handling & Validation
*   **Global Validation Pipe**: `backend/src/main.ts` does not explicitly enable `ValidationPipe` globally, meaning unvalidated DTOs might be entering the system.
*   **Global Exception Filter**: A global exception filter is missing in the bootstrap process, which can lead to inconsistent error response formats across the API.

## 3. Architecture & Consistency
*   **Transaction Management**: The project architecture is standard NestJS, but the relationship between patient flows (e.g., Pharmacy, Lab) suggests a need for robust database transaction management to ensure state consistency during complex operations.

## 4. Testing
*   **Increase Test Coverage**: The file tree shows very few `.spec.ts` files relative to the number of modules. Significant effort should be invested into adding unit and integration tests.

## 5. Frontend UI/UX
*   **Consistent Error Feedback**: Ensure that the frontend correctly handles errors from the `AuthContext` and `api.ts` layers to provide consistent and helpful feedback to the user.
