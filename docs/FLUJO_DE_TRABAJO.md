# Flujo de trabajo de Nexo

Este documento describe cómo se versiona, revisa, prueba y despliega Nexo. Responde directamente a los problemas de la empresa del caso: pérdida de versiones, desorganización del equipo, errores en producción, falta de documentación y ausencia de automatización.

## 1. Modelo de ramas: GitHub Flow

| Modelo | Cómo funciona | Cuándo conviene |
|---|---|---|
| **Git Flow** | Ramas permanentes `main` y `develop`, más `feature/*`, `release/*` y `hotfix/*` | Productos con versiones planificadas y varias versiones en soporte simultáneo |
| **Trunk-Based Development** | Todos integran en `main` varias veces al día, a menudo detrás de *feature flags* | Equipos maduros con pruebas muy completas y despliegue continuo |
| **GitHub Flow** *(adoptado)* | `main` siempre desplegable; cada cambio en una rama corta que vuelve por Pull Request | Equipos pequeños que despliegan una aplicación web de forma continua |

**Por qué GitHub Flow:** es la versión práctica de Trunk-Based para un equipo de dos personas. Mantiene `main` estable (lo protege el pipeline), cada cambio queda revisado en un PR y no exige gestionar una rama `develop` que en un proyecto de dos semanas solo añadiría fusiones.

```
main ──●────────────●──────────●──────────●──────────●──►  (cada ● = PR fusionado y desplegado)
        \          / \        / \        / \        /
         feat/...─●   fix/...●   ci/...─●   docs/..●
```

### Convención de nombres de rama

| Prefijo | Uso | Ejemplo real |
|---|---|---|
| `feat/` | Nueva funcionalidad | `feat/reportes-ciclo-vida` |
| `fix/` | Corrección | `fix/ci-node-24` |
| `docs/` | Documentación / especificaciones | `docs/especificacion-nexo` |
| `ci/` | Pipeline e infraestructura | `ci/pipeline-cicd` |
| `chore/` | Mantenimiento | `chore/iniciar-spec-kit` |

## 2. Commits: Conventional Commits

```
<tipo>(<ámbito opcional>): <descripción en imperativo>

<cuerpo: qué y por qué>
```

Tipos: `feat`, `fix`, `docs`, `test`, `refactor`, `ci`, `chore`. Cada commit es **atómico** (un solo propósito) para que el historial sirva como documentación y se pueda revertir un cambio sin arrastrar otros.

## 3. Ciclo de una funcionalidad (SDD + TDD)

```
Issue ─► spec.md ─► plan.md ─► tasks.md ─► prueba en rojo ─► código ─► verde ─► PR ─► revisión ─► merge ─► deploy
         └──────── GitHub Spec Kit ────────┘   └─────────── TDD ───────────┘   └──── GitHub Actions ────┘
```

1. **Issue** con la plantilla *Nueva funcionalidad* (historia de usuario y criterios Given/When/Then).
2. **Especificación** en `specs/NNN-nombre/` con Spec Kit: `spec.md` (qué y por qué), `plan.md` (cómo, verificado contra la [constitución](../.specify/memory/constitution.md)) y `tasks.md`.
3. **TDD**: se escribe la prueba de contrato que falla y luego el código mínimo que la hace pasar.
4. **Pull Request** con la [plantilla](../.github/pull_request_template.md): enlace a la spec y checklist de seguridad, pruebas y accesibilidad.
5. **Revisión**: CODEOWNERS solicita al revisor automáticamente; el pipeline debe estar en verde.
6. **Merge a `main`** → el pipeline despliega la demo en GitHub Pages.

## 4. Protección de `main` (configurar una vez)

**Settings → Branches → Add branch ruleset** para `main`:

- Requerir Pull Request antes de fusionar (1 aprobación, descartar aprobaciones al haber nuevos commits).
- Requerir que pasen los checks: `Backend · tipos, pruebas y auditoría`, `Backend · integración con PostgreSQL 18`, `Frontend · build y pruebas`, `Analizar JavaScript/TypeScript`.
- Bloquear *force push* y borrado de la rama.

## 5. Historial del proyecto

| PR | Rama | Aporte |
|---|---|---|
| #1–#4 | `chore/iniciar-spec-kit`, `docs/especificacion-nexo`, `docs/plan-tecnico-nexo`, `docs/tareas-nexo` | Spec Kit, especificación, plan y tareas de la spec 001 **antes** de escribir código |
| #5 | `feat/api-backend` | API Express y esquema PostgreSQL |
| #6 | `feat/frontend-base` | Proyecto Angular base |
| #7–#8 | `feat/frontend-reportes`, `fix/ci-node-24` | Primer pipeline de GitHub Actions |
| #9 | `feat/reportes-ciclo-vida` | Constitución, spec 002, edición/cancelación en 5 min, notas de solución |
| #10 | `feat/seguridad-api` | Auditoría (spec 003) y endurecimiento del backend |
| — | `feat/ux-ui-rediseno` | Sistema de diseño, móvil primero, sesión por cookie en el frontend |
| — | `ci/pipeline-cicd` | Pipeline build → test (incl. PostgreSQL real) → deploy, CodeQL, Dependabot |
| — | `docs/documentacion-final` | README, este documento, contrato de API e informe actualizados |

## 6. Cómo resuelve cada problema de la empresa

| Problema | Práctica en Nexo |
|---|---|
| Pérdida de versiones | Git + GitHub como fuente única; ninguna copia manual; historial atómico y revertible |
| Desorganización del equipo | Ramas por cambio, Issues con plantillas, PRs con CODEOWNERS y checklist |
| Errores en producción | 68 pruebas automáticas (incluida integración con PostgreSQL) que bloquean el merge; CodeQL y `npm audit` |
| Falta de documentación | SDD: cada funcionalidad nace como especificación versionada junto al código |
| Sin automatización | GitHub Actions compila, prueba, audita y despliega sin intervención manual; Dependabot actualiza dependencias |
