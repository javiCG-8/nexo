---
description: "Task list for the Nexo multi-organization IT support MVP"
---

# Tasks: Mesa de ayuda TI multi-organización

**Input**: Design documents from `/specs/001-it-support-desk/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/rest-api.md](./contracts/rest-api.md), [quickstart.md](./quickstart.md)

**Tests**: Included because the plan explicitly requires Jasmine/Jest automated tests and the user requested tests and GitHub Actions.

**Organization**: Tasks are grouped by user story so each increment can be implemented and tested independently after the foundational phase.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize the Angular frontend, Express API, PostgreSQL tooling and shared development conventions.

- [ ] T001 Create the `backend/` and `frontend/` workspace structure with package manifests at `backend/package.json` and `frontend/package.json`
- [ ] T002 [P] Initialize Angular application configuration in `frontend/angular.json`, `frontend/tsconfig.json` and `frontend/src/index.html`
- [ ] T003 [P] Initialize the Express TypeScript application entry points in `backend/src/app.ts` and `backend/src/server.ts`
- [ ] T004 [P] Configure Jasmine/Karma scripts in `frontend/package.json` and Jest/Supertest scripts in `backend/package.json`
- [ ] T005 [P] Add repository-level ignore rules for `backend/.env`, `frontend/node_modules/`, `backend/node_modules/` and generated build output in `.gitignore`

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish the tenant-safe persistence, authentication, configuration and API conventions required by every story.

**⚠️ CRITICAL**: No user story implementation starts until this phase is complete.

- [ ] T006 Create environment configuration validation in `backend/src/config/env.ts` for `NODE_ENV`, `PORT`, `DATABASE_URL`, `AUTH_SECRET` and `FRONTEND_ORIGIN`, failing startup when required values are missing
- [ ] T007 [P] Create PostgreSQL connection and transaction helpers in `backend/src/db/client.ts` and `backend/src/db/transaction.ts`
- [ ] T008 [P] Create the initial PostgreSQL migration for `organizations`, `users`, `categories` and `reports` in `backend/src/db/migrations/001_initial.sql`, including UUID identifiers, required `organization_id`, foreign keys and unique organization-scoped user email/category code constraints
- [ ] T009 Create seed data for two organizations, one `USER`, one `TECHNICIAN`, and active `COMPUTER`/`NETWORK` categories per organization in `backend/src/db/seed.ts`
- [ ] T010 [P] Implement password hashing and login token creation in `backend/src/auth/password.ts` and `backend/src/auth/token.ts`
- [ ] T011 Implement authentication middleware that derives `userId`, `organizationId` and `role` from the token in `backend/src/middleware/authenticate.ts`
- [ ] T012 [P] Implement role guard middleware for `USER` and `TECHNICIAN` in `backend/src/middleware/authorize.ts`
- [ ] T013 [P] Implement uniform JSON error handling and request validation responses in `backend/src/middleware/error-handler.ts` and `backend/src/shared/errors.ts`
- [ ] T014 Implement `POST /api/v1/auth/login` and `GET /api/v1/health` in `backend/src/auth/auth.routes.ts` and `backend/src/app.ts`
- [ ] T015 [P] Add Angular API client, token storage and route guard foundations in `frontend/src/app/core/api-client.service.ts`, `frontend/src/app/core/auth.service.ts` and `frontend/src/app/core/auth.guard.ts`
- [ ] T016 [P] Add shared report/category/status types using `OPEN`, `IN_PROGRESS` and `RESOLVED` in `frontend/src/app/shared/models/report.ts` and `frontend/src/app/shared/models/category.ts`
- [ ] T017 [P] Add frontend environment configuration for the API base URL in `frontend/src/environments/environment.ts` and `frontend/src/environments/environment.prod.ts`

**Checkpoint**: Database, tenant context, authentication, error conventions and shared client types are ready; user stories can proceed.

## Phase 3: User Story 1 - Reportar un incidente (Priority: P1) 🎯 MVP

**Goal**: A user can load organization-scoped categories and create a valid report that starts in `OPEN`.

**Independent Test**: Authenticate as a seeded user, load `COMPUTER`/`NETWORK`, submit a valid report, and verify `201 Created`, `status: OPEN`, organization ownership and empty technician assignment.

### Tests for User Story 1

- [ ] T018 [P] [US1] Add Jest/Supertest contract tests for login, `GET /api/v1/categories` and `POST /api/v1/reports` in `backend/tests/reports/create-report.contract.spec.ts`
- [ ] T019 [P] [US1] Add Jest integration tests for required fields, enum priorities, active category validation and cross-organization category rejection in `backend/tests/reports/create-report.integration.spec.ts`
- [ ] T020 [P] [US1] Add Jasmine tests for category loading and report form validation in `frontend/src/app/reports/report-create.component.spec.ts`

### Implementation for User Story 1

- [ ] T021 [P] [US1] Implement organization-scoped category repository and `GET /api/v1/categories` in `backend/src/categories/category.repository.ts` and `backend/src/categories/category.routes.ts`
- [ ] T022 [P] [US1] Implement report persistence model with required `title`, `description`, `categoryId`, priority enum `LOW|MEDIUM|HIGH|CRITICAL`, default status `OPEN`, `reporterId`, `technicianId` nullable and timestamps in `backend/src/reports/report.repository.ts`
- [ ] T023 [US1] Implement report creation validation and service enforcing an active category in the authenticated organization in `backend/src/reports/report.service.ts`
- [ ] T024 [US1] Implement `POST /api/v1/reports` with `USER` authorization and `400 VALIDATION_ERROR`/`400 INVALID_CATEGORY` responses in `backend/src/reports/report.routes.ts`
- [ ] T025 [P] [US1] Implement Angular category service and report creation form in `frontend/src/app/reports/category.service.ts` and `frontend/src/app/reports/report-create.component.ts`
- [ ] T026 [US1] Add report creation route and navigation for authenticated users in `frontend/src/app/app.routes.ts` and `frontend/src/app/app.component.ts`

**Checkpoint**: User Story 1 is independently usable and testable.

## Phase 4: User Story 2 - Gestionar y atender reportes (Priority: P1)

**Goal**: A technician can list organization reports, assign an unassigned report to themselves and advance it through canonical states.

**Independent Test**: Authenticate as a technician, list organization reports, assign one, change it from `OPEN` to `IN_PROGRESS` to `RESOLVED`, and verify invalid transitions and double assignment are rejected.

### Tests for User Story 2

- [ ] T027 [P] [US2] Add Jest/Supertest contract tests for `GET /api/v1/reports`, assignment and status endpoints in `backend/tests/reports/manage-report.contract.spec.ts`
- [ ] T028 [P] [US2] Add Jest concurrency and authorization tests for same-organization technician assignment, already-assigned conflict and invalid status transitions in `backend/tests/reports/manage-report.integration.spec.ts`
- [ ] T029 [P] [US2] Add Jasmine tests for technician report list, assign action and `OPEN`/`IN_PROGRESS`/`RESOLVED` status controls in `frontend/src/app/reports/report-list.component.spec.ts`

### Implementation for User Story 2

- [ ] T030 [US2] Implement organization-scoped report listing with optional `status`, `priority`, `categoryId` and `technicianId` filters in `backend/src/reports/report.repository.ts`
- [ ] T031 [US2] Implement assignment service using a transaction/conditional update so only an unassigned report can be claimed in `backend/src/reports/report.service.ts`
- [ ] T032 [US2] Implement status transition validation allowing only `OPEN -> IN_PROGRESS -> RESOLVED` for the assigned technician in `backend/src/reports/report.service.ts`
- [ ] T033 [US2] Implement technician report list, `PATCH /reports/:id/assignment` and `PATCH /reports/:id/status` routes in `backend/src/reports/report.routes.ts`
- [ ] T034 [P] [US2] Implement Angular report list service and technician actions in `frontend/src/app/reports/report.service.ts` and `frontend/src/app/reports/report-list.component.ts`
- [ ] T035 [US2] Add role-aware technician routing and hide assignment/status controls from `USER` accounts in `frontend/src/app/app.routes.ts` and `frontend/src/app/reports/report-list.component.html`

**Checkpoint**: User Story 2 is independently usable and testable with seeded data.

## Phase 5: User Story 3 - Consultar el avance de un reporte (Priority: P1)

**Goal**: A user can list and inspect only their organization's own reports and see the current technician and canonical status.

**Independent Test**: Log in as a user, verify own reports and updated statuses are visible, then request another user's or another organization's report and verify no data is disclosed.

### Tests for User Story 3

- [ ] T036 [P] [US3] Add Jest/Supertest contract tests for user-scoped `GET /api/v1/reports` and `GET /api/v1/reports/:id` in `backend/tests/reports/view-report.contract.spec.ts`
- [ ] T037 [P] [US3] Add Jest integration tests proving own-organization ownership filtering and cross-organization `404 REPORT_NOT_FOUND` behavior in `backend/tests/reports/view-report.integration.spec.ts`
- [ ] T038 [P] [US3] Add Jasmine tests for user report list/detail rendering and technician/status visibility in `frontend/src/app/reports/report-status.component.spec.ts`

### Implementation for User Story 3

- [ ] T039 [US3] Implement repository queries that restrict `USER` results to the authenticated `organizationId` and `reporterId` in `backend/src/reports/report.repository.ts`
- [ ] T040 [US3] Implement authorization for report detail so cross-organization requests return `404 REPORT_NOT_FOUND` and unauthorized owners cannot view details in `backend/src/reports/report.service.ts`
- [ ] T041 [US3] Add user-capable `GET /api/v1/reports` and `GET /api/v1/reports/:id` response mapping in `backend/src/reports/report.routes.ts`
- [ ] T042 [P] [US3] Implement Angular user report list/detail display with `OPEN`, `IN_PROGRESS` and `RESOLVED` labels in `frontend/src/app/reports/report-status.component.ts` and `frontend/src/app/reports/report-status.component.html`
- [ ] T043 [US3] Add user report navigation and refresh behavior after technician changes status in `frontend/src/app/app.routes.ts` and `frontend/src/app/reports/report-status.component.ts`

**Checkpoint**: User Story 3 is independently usable and testable against the API's tenant and ownership boundaries.

## Phase 6: User Story 4 - Preparar categorías configurables (Priority: P2)

**Goal**: Categories are persisted and organization-scoped, while the MVP deliberately excludes a category administration screen.

**Independent Test**: Seed two organizations, verify each receives `COMPUTER` and `NETWORK`, query categories under each login, and confirm the API rejects cross-organization category use.

### Tests for User Story 4

- [ ] T044 [P] [US4] Add Jest/Supertest tests for category isolation, active-only listing and future-safe category identifiers in `backend/tests/categories/category-isolation.integration.spec.ts`
- [ ] T045 [P] [US4] Add Jasmine tests confirming the report form consumes categories from the API and contains no category administration screen in `frontend/src/app/reports/category.service.spec.ts`

### Implementation for User Story 4

- [ ] T046 [US4] Add organization-scoped category indexes, active flag and non-destructive deletion constraints in `backend/src/db/migrations/002_category_constraints.sql`
- [ ] T047 [US4] Refactor category seed to be idempotent for every organization and preserve `COMPUTER`/`NETWORK` codes in `backend/src/db/seed.ts`
- [ ] T048 [US4] Add future administration-ready category service boundaries without exposing write routes in `backend/src/categories/category.service.ts`
- [ ] T049 [US4] Document the deferred category administration API/UI boundary in `backend/src/categories/README.md` and `specs/001-it-support-desk/contracts/rest-api.md`

**Checkpoint**: Category data is reusable across organizations and ready for a later admin interface without expanding the MVP UI.

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Automate quality gates, validate the documented workflow and harden the shared implementation.

- [ ] T050 [P] Add GitHub Actions workflow for backend/frontend install, migration setup, Jest, Jasmine and both builds in `.github/workflows/ci.yml`
- [ ] T051 [P] Add PostgreSQL service configuration and test environment variables to `.github/workflows/ci.yml` without committing secrets
- [ ] T052 [P] Add Angular and API loading/error states for failed requests and unavailable categories in `frontend/src/app/shared/error-state.component.ts` and `backend/src/middleware/error-handler.ts`
- [ ] T053 [P] Add structured request and operation logging without passwords or authentication tokens in `backend/src/middleware/request-logger.ts`
- [ ] T054 Run the complete quickstart smoke scenario and record any command corrections in `specs/001-it-support-desk/quickstart.md`
- [ ] T055 Review all API queries and tests for mandatory organization filters, protected credential omission and canonical status consistency in `backend/src/`
- [ ] T056 Run Jest, Jasmine, backend build, frontend build and CI-equivalent commands before marking the MVP complete

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup; blocks all stories.
- **US1 (Phase 3)**: Depends on Foundational; delivers the MVP's first end-to-end slice.
- **US2 (Phase 4)**: Depends on Foundational and the report persistence from US1; it can begin after the shared report repository contract is stable.
- **US3 (Phase 5)**: Depends on Foundational and the report endpoints from US1/US2.
- **US4 (Phase 6)**: Depends on Foundational; should complete before final integration because US1 consumes its category API.
- **Polish (Phase 7)**: Depends on all MVP stories selected for delivery.

### User Story Dependencies

- **US1 (P1)**: Foundational only; recommended first implementation slice and MVP baseline.
- **US2 (P1)**: Foundational + US1 report persistence; extends the report workflow.
- **US3 (P1)**: Foundational + US1/US2 report endpoints; validates ownership and status visibility.
- **US4 (P2)**: Foundational; category persistence is consumed by US1, so its database/seed tasks should be completed before US1 integration.

### Parallel Opportunities

- Setup tasks T002-T005 can run in parallel after T001.
- Foundational tasks T007-T008, T010, T012-T013, T015-T017 can run in parallel after the workspace exists; T009 depends on T008.
- Within US1, T018-T020 can run in parallel before implementation; T021-T022 and T025 can run in parallel after foundational contracts.
- Within US2, T027-T029 can run in parallel; T030 and T034 can proceed in parallel after US1.
- Within US3, T036-T038 can run in parallel; T039-T040 and T042 can proceed in parallel after the shared API contract.
- Within US4, T044-T045 can run in parallel; T046-T047 can proceed in sequence.
- Polish tasks T050-T053 can run in parallel after the required application scripts exist.

## Implementation Strategy

1. Complete Setup and Foundational phases.
2. Deliver **US1 + the category persistence/seed slice of US4** as the one-week MVP baseline: users can authenticate, load organization categories and create reports.
3. Add US2 so technicians can list, assign and resolve reports.
4. Add US3 so users can reliably follow progress and tenant/ownership isolation is verified.
5. Complete US4's future administration boundary and the CI/polish phase.

## Independent Test Criteria Summary

- **US1**: A seeded user creates a valid report with an API category and receives `OPEN`; invalid or cross-organization category input is rejected.
- **US2**: A seeded technician lists only their organization's reports, claims an unassigned report once and performs `OPEN -> IN_PROGRESS -> RESOLVED`.
- **US3**: A user sees only their own reports and current status/technician; another user or organization cannot retrieve them.
- **US4**: Each organization has persisted `COMPUTER` and `NETWORK` categories, category reads are isolated, and no admin UI is included.
