# REST API Contract

Base path: `/api/v1`. Every authenticated request carries an organization context from the authenticated user; clients cannot choose a different organization through request data.

JSON errors use:

```json
{
  "error": {
    "code": "REPORT_NOT_FOUND",
    "message": "Report not found"
  }
}
```

## Authentication

### `POST /auth/login`

Request:

```json
{ "organizationSlug": "utmach", "email": "user@example.com", "password": "secret" }
```

`200 OK`:

```json
{
  "token": "opaque-or-signed-token",
  "user": {
    "id": "uuid",
    "organizationId": "uuid",
    "name": "Ana",
    "email": "user@example.com",
    "role": "USER"
  }
}
```

Invalid credentials or organization return `401 AUTHENTICATION_FAILED`.

## Categories

### `GET /categories`

Role: authenticated `USER` or `TECHNICIAN`.

Returns only active categories belonging to the authenticated user's organization:

```json
{
  "items": [
    { "id": "uuid", "code": "COMPUTER", "name": "Computadores", "active": true },
    { "id": "uuid", "code": "NETWORK", "name": "Redes", "active": true }
  ]
}
```

The MVP has no category administration UI. The API and data model reserve this resource for a future administrator interface.

## Reports

### `POST /reports`

Role: `USER`.

Request:

```json
{
  "title": "No puedo conectarme",
  "description": "El equipo no obtiene dirección de red.",
  "categoryId": "uuid",
  "priority": "HIGH"
}
```

The category must be active and belong to the user's organization. `201 Created` returns the report with `status: "OPEN"`, its `organizationId`, and `technicianId: null`.

Validation errors return `400 VALIDATION_ERROR`; a category from another organization or an inactive category returns `400 INVALID_CATEGORY`.

### `GET /reports`

Role: `USER` or `TECHNICIAN`.

- `USER`: returns only reports created by the authenticated user in their organization.
- `TECHNICIAN`: returns all reports in their organization.
- Optional query filters: `status`, `priority`, `categoryId`, `technicianId`.

`200 OK`:

```json
{ "items": [ { "id": "uuid", "organizationId": "uuid", "categoryId": "uuid", "status": "OPEN" } ] }
```

### `GET /reports/:id`

Role: `USER` or `TECHNICIAN`.

Returns `200 OK` only when the report belongs to the authenticated user's organization and the actor is allowed to view it. Cross-organization access returns `404 REPORT_NOT_FOUND` to avoid disclosure.

### `PATCH /reports/:id/assignment`

Role: `TECHNICIAN`.

Request:

```json
{ "assignToMe": true }
```

The report and technician must belong to the same organization. If already assigned, returns `409 REPORT_ALREADY_ASSIGNED`.

### `PATCH /reports/:id/status`

Role: assigned `TECHNICIAN`.

Request:

```json
{ "status": "IN_PROGRESS" }
```

Only `OPEN`, `IN_PROGRESS` and `RESOLVED` are accepted, with transitions defined in [data-model.md](../data-model.md). Invalid transitions return `409 INVALID_STATUS_TRANSITION`.

## Health and configuration

### `GET /health`

Unauthenticated endpoint returning `200 OK`:

```json
{ "status": "ok" }
```

Runtime configuration is supplied through environment variables, not committed source: database connection, authentication secret, API port, allowed frontend origin, and runtime environment. Missing required values must prevent startup with an explicit error.
