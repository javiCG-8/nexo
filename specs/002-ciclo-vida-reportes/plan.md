# Implementation Plan: Ciclo de vida del reporte

**Branch**: `feat/reportes-ciclo-vida` | **Date**: 2026-10-20 | **Spec**: [spec.md](./spec.md)

## Summary

Agregar edición y cancelación con ventana de 5 minutos para el usuario, y notas de solución obligatorias al resolver. Reutiliza la arquitectura `routes → service → repository` de la feature 001.

## Constitution Check

| Principio | Cumplimiento |
|---|---|
| I. Spec primero | Esta carpeta se fusiona antes o junto con el código. |
| II. Multi-tenant | Todas las sentencias filtran por `organization_id` y `reporter_id` del token. |
| III. Seguridad | Condiciones de negocio evaluadas en SQL (atómicas); validación de longitud de notas. |
| IV. TDD | Pruebas de contrato para cada código de error nuevo. |
| V. Simplicidad | Sin tablas nuevas: una columna `resolution_notes`. |

## Diseño

### Base de datos

`backend/db/migrations/002_resolution_notes.sql`:

```sql
ALTER TABLE reports ADD COLUMN IF NOT EXISTS resolution_notes text
  CHECK (resolution_notes IS NULL OR length(trim(resolution_notes)) BETWEEN 5 AND 2000);
```

### API

| Método | Ruta | Rol | Éxito | Errores |
|---|---|---|---|---|
| `PUT` | `/reports/:id` | USER dueño | `200` reporte | `400 VALIDATION_ERROR`, `400 INVALID_CATEGORY`, `404`, `409 REPORT_LOCKED`, `409 EDIT_WINDOW_EXPIRED` |
| `DELETE` | `/reports/:id` | USER dueño | `200 { id }` | `404`, `409 REPORT_LOCKED`, `409 EDIT_WINDOW_EXPIRED` |
| `PATCH` | `/reports/:id/status` | TECHNICIAN asignado | `200` reporte | `400 VALIDATION_ERROR` si `RESOLVED` sin notas válidas |

Flujo de edición: el servicio intenta el `UPDATE` condicionado; si `rowCount = 0`, consulta el reporte para devolver el error preciso (`404`, `REPORT_LOCKED` o `EDIT_WINDOW_EXPIRED`). Así no existe ventana de carrera entre comprobar y escribir.

### Frontend

- Botones **Editar** y **Cancelar** en el detalle solo cuando el reporte cumple las condiciones (cálculo visual; el servidor decide).
- Diálogo de resolución con `textarea` validado (5–2000) antes de llamar a la API.
