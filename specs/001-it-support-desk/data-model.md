# Data Model: Mesa de ayuda TI multi-organización

## Organization

Tenant boundary for all users, categories and reports.

| Field | Type/shape | Required | Rules |
|---|---|---:|---|
| id | UUID | yes | Unique |
| name | text | yes | Non-empty |
| slug | text | yes | Unique |
| createdAt | timestamp | yes | Set on creation |

## User

Represents a person belonging to one organization.

| Field | Type/shape | Required | Rules |
|---|---|---:|---|
| id | UUID | yes | Unique |
| organizationId | UUID | yes | References `Organization` |
| name | text | yes | Non-empty |
| email | text | yes | Unique within organization, normalized |
| password | protected credential | yes | Never returned by the API |
| role | `USER` \| `TECHNICIAN` | yes | Controls access within organization |

## Category

Configurable incident classification stored in PostgreSQL. The MVP seeds `COMPUTER` and `NETWORK`; no category administration screen is included.

| Field | Type/shape | Required | Rules |
|---|---|---:|---|
| id | UUID | yes | Unique |
| organizationId | UUID | yes | References `Organization` |
| code | text | yes | Unique within organization |
| name | text | yes | Non-empty |
| active | boolean | yes | Inactive categories cannot be selected for new reports |

## Report

Represents an incident submitted by a user.

| Field | Type/shape | Required | Rules |
|---|---|---:|---|
| id | UUID | yes | Public identifier |
| organizationId | UUID | yes | Must match reporter and category |
| title | text | yes | Non-empty, bounded length |
| description | text | yes | Non-empty, bounded length |
| categoryId | UUID | yes | References an active category in the same organization |
| priority | `LOW` \| `MEDIUM` \| `HIGH` \| `CRITICAL` | yes | Required enum |
| status | `OPEN` \| `IN_PROGRESS` \| `RESOLVED` | yes | Defaults to `OPEN` |
| reporterId | UUID | yes | References a user in the same organization |
| technicianId | UUID nullable | no | References a technician in the same organization |
| createdAt | timestamp | yes | Set on creation |
| updatedAt | timestamp | yes | Updated on assignment/status change |

### Relationships and tenant invariants

- One `Organization` has many users, categories and reports.
- Every user, category and report has exactly one `organizationId`.
- A report's reporter, category and technician must belong to its organization.
- A user can list and retrieve only reports in their organization that they created.
- A technician can list and manage reports only in their organization.
- Category codes are unique per organization, allowing each organization to configure its own catalog.
- Categories are deactivated rather than physically deleted so historical reports remain valid.

### Validation and state invariants

- Only authenticated users with role `USER` can create reports.
- New reports require an active `categoryId` from the authenticated user's organization.
- Assignment is allowed only when `technicianId` is null and the authenticated user is a technician.
- Valid status transitions are `OPEN -> IN_PROGRESS -> RESOLVED`; invalid transitions return a conflict.
- Assignment and status change update `updatedAt`.
- The API never returns the protected credential field.

## State transition table

| Current | Allowed next state | Actor |
|---|---|---|
| OPEN | IN_PROGRESS | Assigned technician |
| IN_PROGRESS | RESOLVED | Assigned technician |
| RESOLVED | none | No further change in MVP |
