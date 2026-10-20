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

> Actualizado por la [spec 003](../../003-seguridad/spec.md): la sesión viaja en una cookie `HttpOnly`; el token ya no se devuelve en el cuerpo.

### `POST /auth/login`

Request (campos desconocidos se rechazan con `400`):

```json
{ "organizationSlug": "utmach", "email": "user@example.com", "password": "secret" }
```

`200 OK` + cabecera `Set-Cookie: nexo_session=<jwt>; HttpOnly; SameSite=Strict; Path=/api` (`Secure` en producción):

```json
{
  "user": {
    "id": "uuid",
    "organizationId": "uuid",
    "organizationSlug": "utmach",
    "name": "Ana",
    "email": "user@example.com",
    "role": "USER"
  }
}
```

Invalid credentials or organization return `401 AUTHENTICATION_FAILED` (misma respuesta y tiempo similar exista o no el usuario). Tras 10 intentos fallidos por IP en 15 minutos: `429 TOO_MANY_REQUESTS`.

### `GET /auth/me`

Devuelve `{ "user": { ... } }` si la cookie es válida; `401` en caso contrario. El frontend lo usa para restaurar la sesión al recargar.

### `POST /auth/logout`

Borra la cookie. `204 No Content`.

### Token

JWT `HS256` con `sub` (usuario), `org` (organización), `role`, `iss = nexo-api`, `aud = nexo-web` y expiración de 8 h. Los clientes de API (Postman, pruebas) pueden enviarlo también como `Authorization: Bearer <jwt>`.

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

Al pasar a `RESOLVED` es obligatorio `resolutionNotes` (5 a 2000 caracteres); si falta: `400 VALIDATION_ERROR` ([spec 002](../../002-ciclo-vida-reportes/spec.md), FR-004).

```json
{ "status": "RESOLVED", "resolutionNotes": "Se reemplazó el conector RJ-45." }
```

### `PUT /reports/:id` · `DELETE /reports/:id`

Role: `USER` autor del reporte. Solo mientras el reporte esté `OPEN`, sin técnico y tenga menos de 5 minutos ([spec 002](../../002-ciclo-vida-reportes/spec.md)). `PUT` acepta cualquier subconjunto de `title`, `description`, `categoryId`, `priority`.

| Situación | Respuesta |
|---|---|
| Editable | `200` reporte actualizado · `200 { "id": "uuid" }` al cancelar |
| Ya asignado o no `OPEN` | `409 REPORT_LOCKED` |
| Pasaron más de 5 minutos | `409 EDIT_WINDOW_EXPIRED` |
| De otro usuario u organización | `404 REPORT_NOT_FOUND` |

## Errores transversales

| Código HTTP | `error.code` | Cuándo |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Cuerpo, parámetro o filtro inválido. Incluye `details: [{ field, message }]` |
| 400 | `INVALID_JSON` | JSON malformado |
| 401 | `AUTHENTICATION_REQUIRED` / `INVALID_TOKEN` | Sin sesión o token inválido/expirado |
| 403 | `FORBIDDEN` | Rol sin permiso |
| 404 | `NOT_FOUND` | Ruta inexistente |
| 413 | `PAYLOAD_TOO_LARGE` | Cuerpo mayor a 10 kB |
| 415 | `UNSUPPORTED_MEDIA_TYPE` | Cuerpo que no es `application/json` (protección CSRF) |
| 429 | `TOO_MANY_REQUESTS` | Demasiados intentos de login |
| 500 | `INTERNAL_ERROR` | Error inesperado (sin detalles internos) |

## Health and configuration

### `GET /health`

Unauthenticated endpoint returning `200 OK`:

```json
{ "status": "ok" }
```

`GET /health/ready` verifica además la conexión con PostgreSQL: `200 { "status": "ok", "database": true }` o `503`.

Runtime configuration is supplied through environment variables, not committed source: database connection, authentication secret, API port, allowed frontend origin, and runtime environment. Missing required values must prevent startup with an explicit error.
