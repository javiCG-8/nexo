# Feature Specification: Ciclo de vida del reporte

**Feature Branch**: `feat/reportes-ciclo-vida`

**Created**: 2026-10-20

**Status**: Approved

**Depends on**: [001-it-support-desk](../001-it-support-desk/spec.md)

**Input**: "El usuario debe poder corregir o cancelar un reporte si se equivocó al crearlo, pero solo durante un tiempo corto y mientras nadie lo esté atendiendo. Al resolver, el técnico debe dejar escrito qué hizo para que el usuario lo sepa."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Corregir un reporte recién creado (Priority: P1)

Como usuario, quiero editar el título, la descripción, la categoría o la prioridad de mi reporte durante los primeros 5 minutos para corregir errores sin crear un reporte duplicado.

**Independent Test**: Crear un reporte, editarlo antes de 5 minutos y verificar los cambios; intentar editarlo después y verificar el rechazo.

**Acceptance Scenarios**:

1. **Given** un reporte propio en estado `OPEN`, sin técnico asignado y creado hace menos de 5 minutos, **When** el usuario envía cambios válidos, **Then** el reporte se actualiza y `updatedAt` cambia.
2. **Given** un reporte creado hace más de 5 minutos, **When** el usuario intenta editarlo, **Then** el sistema responde `409 EDIT_WINDOW_EXPIRED` y no modifica nada.
3. **Given** un reporte que ya tiene técnico asignado o no está `OPEN`, **When** el usuario intenta editarlo, **Then** el sistema responde `409 REPORT_LOCKED`.
4. **Given** un reporte de otro usuario u organización, **When** el usuario intenta editarlo, **Then** el sistema responde `404 REPORT_NOT_FOUND`.

### User Story 2 - Cancelar un reporte creado por error (Priority: P2)

Como usuario, quiero cancelar un reporte dentro de los primeros 5 minutos para no ocupar a los técnicos con un incidente inexistente.

**Acceptance Scenarios**:

1. **Given** un reporte propio editable (mismas condiciones que la historia 1), **When** el usuario confirma la cancelación, **Then** el reporte deja de aparecer en los listados.
2. **Given** un reporte fuera de la ventana o ya asignado, **When** el usuario intenta cancelarlo, **Then** el sistema responde `409` con el código correspondiente.

### User Story 3 - Registrar la solución al resolver (Priority: P1)

Como técnico, quiero escribir las notas de solución al marcar un reporte como `RESOLVED` para que el usuario sepa qué se hizo y quede historial técnico.

**Acceptance Scenarios**:

1. **Given** un reporte `IN_PROGRESS` asignado al técnico, **When** lo resuelve con notas de 5 a 2000 caracteres, **Then** el estado pasa a `RESOLVED` y las notas quedan guardadas.
2. **Given** un intento de resolver sin notas o con notas fuera de rango, **When** se envía, **Then** el sistema responde `400 VALIDATION_ERROR`.
3. **Given** un reporte resuelto, **When** el usuario dueño lo consulta, **Then** ve las notas de solución.

### Edge Cases

- Dos peticiones simultáneas (edición del usuario y asignación del técnico): la condición se evalúa en la misma sentencia SQL, por lo que solo una gana; la perdedora recibe `409`.
- El reloj del navegador puede diferir del servidor: la ventana de 5 minutos se calcula con `now()` de PostgreSQL, nunca con la hora del cliente. La interfaz solo usa su reloj para mostrar u ocultar botones.

## Requirements *(mandatory)*

- **FR-001**: El sistema MUST permitir `PUT /reports/:id` al dueño del reporte solo si `status = OPEN`, `technician_id IS NULL` y `created_at >= now() - 5 min`.
- **FR-002**: El sistema MUST permitir `DELETE /reports/:id` bajo las mismas condiciones que FR-001.
- **FR-003**: Las condiciones de FR-001/FR-002 MUST evaluarse atómicamente en la sentencia `UPDATE`/`DELETE`.
- **FR-004**: `PATCH /reports/:id/status` con `status = RESOLVED` MUST exigir `resolutionNotes` de 5 a 2000 caracteres.
- **FR-005**: Las notas de solución MUST mostrarse al técnico y al usuario dueño en el detalle del reporte.
- **FR-006**: El esquema MUST versionarse mediante un script de migración; la aplicación no ejecuta DDL en tiempo de ejecución.

## Success Criteria

- **SC-001**: 100 % de las reglas FR-001 a FR-004 cubiertas por pruebas de contrato automatizadas.
- **SC-002**: Ningún reporte asignado puede ser editado o cancelado por el usuario (verificado por prueba).
