# Constitución de Nexo

Principios que gobiernan el desarrollo de Nexo, la mesa de ayuda TI multi-organización. Toda especificación, plan, tarea y Pull Request se evalúa contra este documento.

## Principios fundamentales

### I. La especificación precede al código (Spec Driven Development)

Ninguna funcionalidad se implementa sin una especificación en `specs/NNN-nombre/` que contenga al menos `spec.md`, `plan.md` y `tasks.md`. La especificación describe el **qué** y el **porqué** en lenguaje de negocio; el plan describe el **cómo**. Si el código y la especificación divergen, se corrige primero la especificación y luego el código.

### II. Aislamiento por organización (multi-tenant) no negociable

Cada consulta que lee o escribe datos de negocio filtra por `organization_id` obtenido del token autenticado, nunca de datos enviados por el cliente. Las claves foráneas compuestas `(id, organization_id)` garantizan el aislamiento también en la base de datos. El acceso a recursos de otra organización responde `404` para no revelar su existencia.

### III. Seguridad por defecto en todas las capas

- Validación estricta de entrada con esquemas en el borde de la API; los datos inválidos se rechazan, no se "limpian".
- Consultas SQL siempre parametrizadas.
- Contraseñas con bcrypt; tokens JWT firmados con algoritmo fijado, emisor, audiencia y expiración.
- El token de sesión viaja en una cookie `HttpOnly`, `SameSite=Strict`; nunca es accesible desde JavaScript.
- Cabeceras HTTP seguras (Helmet), CORS restringido a un único origen y límite de tasa en autenticación.
- Ningún secreto, `.env` o credencial real se versiona.

### IV. Pruebas primero (TDD) e integradas al pipeline

Cada regla de negocio tiene una prueba automatizada que falla antes de implementarla. Las pruebas de contrato de la API (Jest + Supertest) y de componentes (Vitest) se ejecutan en GitHub Actions en cada Pull Request; un pipeline en rojo bloquea la integración.

### V. Simplicidad y arquitectura por capas

Backend organizado por módulos de dominio (`auth`, `reports`, `categories`) con capas `routes → service → repository`. Las rutas solo validan y delegan; los servicios contienen las reglas de negocio; los repositorios solo SQL. Frontend Angular con componentes standalone, señales y separación `core / features / shared`. Se rechaza la complejidad que no responda a un requisito.

### VI. Accesibilidad y diseño móvil primero

La interfaz cumple WCAG 2.1 AA: contraste suficiente, foco visible, navegación por teclado, etiquetas en formularios y objetivos táctiles ≥ 44 px. Se diseña primero para pantallas móviles y se amplía a escritorio.

## Flujo de trabajo

- **Ramas**: GitHub Flow. `main` siempre desplegable; cada cambio vive en una rama `feat/`, `fix/`, `docs/`, `ci/` o `chore/`.
- **Commits**: Conventional Commits en español (`feat:`, `fix:`, `docs:`, `ci:`, `refactor:`, `test:`, `chore:`), atómicos y descriptivos.
- **Pull Requests**: todo cambio llega a `main` mediante PR con descripción, enlace a la especificación y pipeline en verde. Se requiere revisión antes de fusionar.
- **Versionado de la base de datos**: el esquema se modifica mediante scripts en `backend/db/migrations/` y se refleja en `schema.sql`; nunca con DDL ejecutado desde el código de la aplicación.

## Gobernanza

Esta constitución prevalece sobre cualquier otra práctica. Las enmiendas se proponen mediante Pull Request que actualice este archivo, explique el motivo e incremente la versión.

**Versión**: 1.0.0 | **Ratificada**: 2026-10-09 | **Última enmienda**: 2026-10-20
