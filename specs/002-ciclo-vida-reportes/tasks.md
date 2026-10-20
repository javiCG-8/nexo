# Tasks: Ciclo de vida del reporte

**Input**: [spec.md](./spec.md), [plan.md](./plan.md)

## Phase 1: Base de datos

- [x] T001 Crear migración `backend/db/migrations/002_resolution_notes.sql` y reflejar la columna en `backend/db/schema.sql`
- [x] T002 Eliminar el `ALTER TABLE` ejecutado en tiempo de ejecución desde `backend/src/db/pool.ts`

## Phase 2: Pruebas primero (deben fallar antes de T005–T007)

- [x] T003 [P] Pruebas de contrato para `PUT /reports/:id`: éxito, `REPORT_LOCKED`, `EDIT_WINDOW_EXPIRED`, `404`
- [x] T004 [P] Pruebas de contrato para `DELETE /reports/:id` y para `RESOLVED` sin notas

## Phase 3: Backend

- [x] T005 Repositorio: `UPDATE`/`DELETE` condicionados por estado, técnico nulo y ventana de 5 min con `now()`
- [x] T006 Servicio: diagnóstico del error cuando `rowCount = 0`
- [x] T007 Servicio: validación de `resolutionNotes` al resolver

## Phase 4: Frontend

- [x] T008 Servicio Angular `update`, `cancel` y `updateStatus(…, notes)`
- [x] T009 Formulario reutilizable en modo creación/edición
- [x] T010 Diálogo de resolución con notas obligatorias y detalle con notas visibles

## Phase 5: Verificación

- [x] T011 `npm test` (backend) y `ng build` + `ng test` (frontend) en verde en GitHub Actions
