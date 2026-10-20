# Nexo · Mesa de ayuda TI multi-organización

[![CI/CD](https://github.com/javiCG-8/nexo/actions/workflows/ci.yml/badge.svg)](https://github.com/javiCG-8/nexo/actions/workflows/ci.yml)
[![CodeQL](https://github.com/javiCG-8/nexo/actions/workflows/codeql.yml/badge.svg)](https://github.com/javiCG-8/nexo/actions/workflows/codeql.yml)

Nexo permite que los usuarios de una organización (por ejemplo, la UTMACH) **reporten incidentes de TI** desde el móvil o el escritorio y que los **técnicos los prioricen, se los asignen y los resuelvan** dejando trazabilidad. Cada organización está aislada de las demás.

Proyecto del **Primer Parcial de Programación Móvil**: una aplicación Angular con base de datos construida con **Spec Driven Development (GitHub Spec Kit)**, **GitHub Flow con Pull Requests**, **TDD** y un pipeline **CI/CD en GitHub Actions** (build → test → deploy).

**Demo pública:** https://javicg-8.github.io/nexo/ (funciona con datos simulados en el navegador; ver [Despliegue](#despliegue)).

---

## Funcionalidades

| Rol | Puede |
|---|---|
| **Usuario** | Crear reportes (título, detalle, categoría, impacto) · seguir su estado en tiempo real · **editar o cancelar durante 5 minutos** mientras nadie lo atienda · leer la solución aplicada |
| **Técnico** | Ver la bandeja de su organización en **lista o tablero Kanban** · filtrar por "sin asignar" o "míos" · **asignarse** un reporte · avanzar `Abierto → En proceso → Resuelto` · **registrar la solución** (obligatoria) |

Interfaz móvil primero (barra de pestañas, hojas inferiores), tema claro/oscuro, accesible con teclado y lector de pantalla, e instalable como PWA.

## Arquitectura

```
┌──────────────────────────── Navegador / móvil ───────────────────────────┐
│ Angular 22 (standalone + signals, zoneless)                              │
│  core/      sesión, guards, interceptor, reglas compartidas, demo        │
│  features/  auth · reports (data → store → ui → pages)                   │
│  shared/ui  sistema de diseño: hojas <dialog>, toasts, badges, íconos    │
└───────────────┬──────────────────────────────────────────────────────────┘
                │ HTTPS + cookie HttpOnly (SameSite=Strict)
┌───────────────▼──────────────────────────────────────────────────────────┐
│ API REST Express 5 + TypeScript                                          │
│  helmet · CORS 1 origen · rate limit · require-json (anti-CSRF)          │
│  auth/ categories/ reports/   routes → schemas (zod) → service → repo    │
└───────────────┬──────────────────────────────────────────────────────────┘
                │ SQL parametrizado (pg), pool con timeouts
┌───────────────▼──────────────────────────────────────────────────────────┐
│ PostgreSQL 18 · FK compuestas (id, organization_id) · CHECK · uuidv7()   │
└──────────────────────────────────────────────────────────────────────────┘
```

Decisiones clave (detalle en [`specs/`](specs/)):

- **Multi-tenant en dos capas:** cada consulta filtra por la organización del token y las claves foráneas compuestas impiden mezclar datos entre organizaciones incluso por error de código.
- **Reglas atómicas en SQL:** la ventana de edición y las transiciones de estado se evalúan dentro del `UPDATE`, con `now()` de PostgreSQL; dos técnicos que se asignan a la vez no pueden ganar ambos (probado en integración).
- **Validación en el borde:** esquemas estrictos con zod; los datos inválidos se rechazan, no se "limpian".

## Estructura del repositorio

```
.github/            workflows CI/CD y CodeQL, Dependabot, plantillas de PR e Issues
.specify/           GitHub Spec Kit (constitución y plantillas)
specs/              001 MVP · 002 ciclo de vida del reporte · 003 seguridad
backend/            API Express  (src/, tests/, tests-integration/, db/)
frontend/           App Angular  (src/app/{core,features,shared,layout})
docs/               flujo de trabajo Git y guías
```

## Ejecutar en local

Requisitos: **Node.js 24**, **PostgreSQL 18**.

```powershell
# 1. Base de datos
psql -U postgres -c "CREATE DATABASE nexobd"
psql -U postgres -d nexobd -f backend/db/schema.sql
psql -U postgres -d nexobd -f backend/db/seed.sql

# 2. API (http://localhost:3000)
cd backend
copy .env.example .env      # y completar DATABASE_URL y AUTH_SECRET
npm ci
npm run dev

# 3. Frontend (http://localhost:4200), en otra terminal
cd frontend
npm ci
npm start
```

Cuentas de demostración (contraseña `Nexo123!`, organización `utmach`): `user@example.test` (usuario) y `tech@example.test` (técnico). Lista completa en [`backend/db/README.md`](backend/db/README.md).

## Pruebas

| Suite | Comando | Qué cubre |
|---|---|---|
| Backend unitarias y de contrato | `cd backend && npm run test:coverage` | 38 pruebas · reglas de negocio, autenticación y seguridad · cobertura ≈ 89 % de líneas (mínimo exigido 80 %) |
| Backend integración | `cd backend && npm run test:integration` | 10 pruebas contra PostgreSQL real: esquema, seed idempotente, aislamiento, concurrencia, ventana de 5 min |
| Frontend | `cd frontend && npx ng test --watch=false` | 20 pruebas Vitest · reglas, guards, store y API de demostración |

La integración local usa una base desechable `nexobd_test` (ver [`backend/db/README.md`](backend/db/README.md)).

## Pipeline CI/CD

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) se ejecuta en cada Pull Request y en cada push a `main`:

```
backend ──► integration (postgres:18) ──┐
frontend ───────────────────────────────┴──► deploy (solo main) ──► GitHub Pages
```

1. **backend:** `npm ci` → compilación TypeScript → pruebas con cobertura mínima → `npm audit`.
2. **integration:** contenedor PostgreSQL 18 → esquema, migraciones y seed → flujo completo.
3. **frontend:** pruebas Vitest → `npm audit` → build de producción.
4. **deploy:** publica el frontend en GitHub Pages **solo si todo lo anterior pasó**.

Además: **CodeQL** (análisis estático de seguridad) en cada PR y semanal, y **Dependabot** para dependencias.

## Despliegue

GitHub Pages solo sirve archivos estáticos, así que la demo pública usa una **API simulada en memoria** (`frontend/src/app/core/demo`) que replica las mismas reglas de negocio que la API real. Para desplegar la API real se necesita un servicio con Node.js y PostgreSQL (Render, Railway, Azure, etc.) con las variables de [`backend/.env.example`](backend/.env.example), `NODE_ENV=production` y `TRUST_PROXY=1`.

> Activación única: en GitHub, **Settings → Pages → Source: GitHub Actions**.

## Seguridad

Resumen de la auditoría y los controles en [`specs/003-seguridad/spec.md`](specs/003-seguridad/spec.md): cookie HttpOnly/SameSite=Strict, JWT HS256 con `iss`/`aud`/expiración, límite de intentos de login, comparación bcrypt de tiempo constante, Helmet + CSP, CORS de un solo origen, anti-CSRF por `Content-Type`, validación estricta, errores sin fugas de información, CodeQL y `npm audit` en el pipeline.

## Flujo de trabajo

GitHub Flow con ramas cortas, Conventional Commits y Pull Requests revisados con pipeline en verde. Detalle, comparación con Git Flow y Trunk-Based, e historial de PRs en [`docs/FLUJO_DE_TRABAJO.md`](docs/FLUJO_DE_TRABAJO.md).
