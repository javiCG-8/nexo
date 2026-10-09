# Quickstart: Validación del MVP multi-organización

## Prerequisites

- Node.js LTS and npm.
- PostgreSQL running locally or an accessible test database.
- Two organizations and their seeded `USER` and `TECHNICIAN` accounts.

## Configure through environment variables

Create `backend/.env` locally from `backend/.env.example`:

```text
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/nexo
AUTH_SECRET=replace-with-local-secret
FRONTEND_ORIGIN=http://localhost:4200
```

Do not commit `.env` or real secrets. The API must fail clearly at startup when a required value is missing.

## Install and initialize

```powershell
cd backend
npm ci
npm run migrate
npm run seed

cd ..\frontend
npm ci
```

The seed must create at least two organizations, with `COMPUTER` and `NETWORK` categories in each, plus one user and one technician per organization.

## Run the applications

```powershell
# Terminal 1
cd backend
npm run dev

# Terminal 2
cd frontend
npm start
```

## Automated validation

```powershell
cd backend
npm test
npm run build

cd ..\frontend
npm test -- --watch=false
npm run build
```

Expected results:

- API tests pass for organization isolation, category lookup, report creation using `categoryId`, technician listing, assignment conflict and canonical status transitions.
- Angular tests pass for loading categories from the API, report creation/listing and displaying `OPEN`, `IN_PROGRESS` and `RESOLVED`.
- Both builds complete without errors.

## End-to-end smoke scenario

1. Log in as the `USER` of organization A using its organization slug.
2. Load categories and confirm `COMPUTER` and `NETWORK` come from the API.
3. Create a `NETWORK` report with `HIGH` priority and confirm its status is `OPEN`.
4. Log in as the `TECHNICIAN` of organization A, list reports, assign the report and change its status to `IN_PROGRESS`, then `RESOLVED`.
5. Log in again as the user of organization A and confirm the report shows `RESOLVED`.
6. Log in as a user of organization B and confirm the report and its category data from organization A are not visible.
7. Confirm the API has no category administration screen in the MVP, while `GET /categories` and the persisted category model are ready for a future administrator interface.
