# Tasks: Endurecimiento de seguridad

**Input**: [spec.md](./spec.md)

## Backend (`feat/seguridad-api`)

- [x] T001 Validar longitud mínima de `AUTH_SECRET` y formato de `FRONTEND_ORIGIN` en `backend/src/config/env.ts`; publicar `backend/.env.example`
- [x] T002 [P] Módulo `auth/token.ts`: firma y verificación con `HS256`, `iss`, `aud`, `sub`, expiración 8 h (FR-003)
- [x] T003 [P] Módulo `auth/session-cookie.ts`: cookie `HttpOnly`, `SameSite=Strict`, `Path=/api`, `Secure` en producción (FR-001)
- [x] T004 `POST /auth/login` con esquema estricto, comparación bcrypt constante y límite de intentos (FR-004, FR-005)
- [x] T005 `GET /auth/me` y `POST /auth/logout` (FR-002)
- [x] T006 Helmet, CORS con credenciales y un único origen, `requireJson` anti-CSRF (FR-007, FR-008)
- [x] T007 Errores `INVALID_JSON`, `PAYLOAD_TOO_LARGE`, `NOT_FOUND` y registro de `500` (FR-009, FR-010)
- [x] T008 Separar `server.ts` (arranque y cierre ordenado) de `app.ts` (composición); `GET /health/ready` verifica la base de datos
- [x] T009 Pruebas: `tests/security.spec.ts`, `tests/rate-limit.spec.ts` y contrato de autenticación en `tests/api.spec.ts`

## Frontend (`feat/ux-ui-rediseno`)

- [x] T010 Sesión basada en cookie: `withCredentials`, restauración con `/auth/me` al iniciar la app, sin token en `localStorage`
- [x] T011 Interceptor que cierra sesión y redirige al login ante `401`
- [x] T012 Guards que envían cada rol a su página de inicio (corrige el bucle de redirecciones)
- [x] T013 CSP y `referrer` en `index.html`; credenciales de demostración visibles solo fuera de producción

## Pipeline

- [x] T014 `npm audit --omit=dev --audit-level=high` y CodeQL en GitHub Actions (SC-002)
