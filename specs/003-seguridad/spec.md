# Feature Specification: Endurecimiento de seguridad

**Feature Branch**: `feat/seguridad-api` (backend) y `feat/ux-ui-rediseno` (frontend)

**Created**: 2026-10-20

**Status**: Approved

**Input**: Auditoría de seguridad del MVP. Riesgos priorizados según OWASP Top 10 (2021) y OWASP API Security Top 10 (2023).

## Hallazgos de la auditoría

| ID | Hallazgo | Riesgo OWASP | Severidad |
|---|---|---|---|
| H-01 | Token JWT guardado en `localStorage`, legible por cualquier script inyectado | A07 Identification & Auth Failures | Alta |
| H-02 | `jwt.verify` sin algoritmo, emisor ni audiencia fijados | A02 Cryptographic Failures | Alta |
| H-03 | Login sin límite de intentos (fuerza bruta / credential stuffing) | API4 Unrestricted Resource Consumption | Alta |
| H-04 | Enumeración de usuarios por tiempo de respuesta (bcrypt solo si el usuario existe) | A07 | Media |
| H-05 | "Sanitización" de XSS con expresiones regulares que altera datos y es evadible | A03 Injection | Media |
| H-06 | Cabeceras de seguridad manuales e incompletas (sin CSP, HSTS; `X-Powered-By` expuesto) | A05 Security Misconfiguration | Media |
| H-07 | IDs y filtros sin validar: un ID no UUID provoca `500` y filtra detalles de PostgreSQL | API8 Security Misconfiguration | Media |
| H-08 | JSON malformado o demasiado grande responde `500` | A05 | Baja |
| H-09 | DDL (`ALTER TABLE`) ejecutado desde el código en cada consulta | A04 Insecure Design | Media |
| H-10 | Guard de rol del frontend provoca bucle infinito de redirecciones para técnicos | Disponibilidad | Media |
| H-11 | Sin política de seguridad de contenido (CSP) en el frontend | A05 | Media |
| H-12 | Secreto JWT sin longitud mínima | A02 | Media |

H-07 y H-09 se corrigieron en la spec 002. Esta spec cubre el resto.

## Requirements

- **FR-001** (H-01): La sesión MUST viajar en una cookie `nexo_session` con `HttpOnly`, `SameSite=Strict`, `Path=/api` y `Secure` en producción. El frontend no almacena el token.
- **FR-002**: MUST existir `GET /auth/me` (restaurar sesión) y `POST /auth/logout` (borrar cookie).
- **FR-003** (H-02, H-12): Los JWT MUST firmarse y verificarse solo con `HS256`, `iss = nexo-api`, `aud = nexo-web`, expiración de 8 h y un secreto de al menos 32 caracteres; el payload contiene solo `sub`, `org` y `role`.
- **FR-004** (H-03): `POST /auth/login` MUST limitarse a 10 intentos fallidos por IP cada 15 minutos (`429 TOO_MANY_REQUESTS`).
- **FR-005** (H-04): El login MUST ejecutar una comparación bcrypt aunque el usuario no exista.
- **FR-006** (H-05): Se elimina la sanitización por regex; toda entrada se valida con esquemas estrictos (campos desconocidos rechazados) y Angular escapa toda salida por defecto.
- **FR-007** (H-06): La API MUST usar Helmet (CSP `default-src 'none'`, HSTS en producción, `X-Content-Type-Options`, `Referrer-Policy`, sin `X-Powered-By`).
- **FR-008** (CSRF): Las peticiones que modifican estado MUST tener `Content-Type: application/json` (`415` en caso contrario). Junto con `SameSite=Strict` y CORS de un solo origen impide CSRF.
- **FR-009** (H-08): JSON malformado → `400 INVALID_JSON`; cuerpo > 10 kB → `413 PAYLOAD_TOO_LARGE`; ruta inexistente → `404 NOT_FOUND`.
- **FR-010**: Los errores `500` se registran en el servidor y nunca exponen detalles internos al cliente.
- **FR-011** (H-10, H-11): El frontend redirige cada rol a su página de inicio, cierra sesión ante un `401` y declara una CSP.

## Success Criteria

- **SC-001**: Cada requisito FR-001 a FR-009 tiene al menos una prueba automatizada.
- **SC-002**: `npm audit --omit=dev` sin vulnerabilidades altas o críticas en el pipeline.
