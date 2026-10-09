# Feature Specification: Mesa de ayuda de soporte TI

**Feature Branch**: `001-it-support-desk`

**Created**: 2026-10-09

**Status**: Draft

**Input**: User description: "Nexo es una help desk de soporte TI para una organización como la UTMACH o una empresa pequeña. Los usuarios reportan incidentes de computadores o red indicando categoría, prioridad y descripción. Los técnicos ven la lista de reportes, se asignan uno y cambian su estado entre abierto, en proceso y resuelto. El usuario puede consultar cómo va su reporte. Las categorías deben poder configurarse para que Nexo sirva en otros lugares."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Reportar un incidente (Priority: P1)

Como usuario de la organización, quiero registrar un incidente de computador o red con su categoría, prioridad y descripción para solicitar soporte y dejar constancia del problema.

**Why this priority**: El registro de incidentes es el punto de entrada indispensable para que la organización pueda organizar y atender solicitudes de soporte.

**Independent Test**: Puede probarse creando un incidente válido y verificando que se genere un reporte consultable con toda la información proporcionada.

**Acceptance Scenarios**:

1. **Given** un usuario autenticado y categorías activas, **When** completa categoría, prioridad y descripción y envía el formulario, **Then** el sistema crea un reporte con identificador único y estado "Abierto".
2. **Given** un formulario de reporte incompleto, **When** el usuario intenta enviarlo, **Then** el sistema indica los campos faltantes y no crea un reporte.
3. **Given** un usuario que registra un incidente, **When** el reporte es creado, **Then** el usuario puede ver su identificador, fecha, prioridad, categoría y estado inicial.

---

### User Story 2 - Gestionar y atender reportes (Priority: P1)

Como técnico, quiero consultar los reportes pendientes, asignarme uno y actualizar su estado para organizar mi trabajo y comunicar el avance de la atención.

**Why this priority**: Permite convertir los reportes recibidos en trabajo operativo trazable y evita que los incidentes queden sin responsable.

**Independent Test**: Puede probarse con un reporte abierto, asignándolo a un técnico y recorriendo los estados permitidos hasta resolverlo.

**Acceptance Scenarios**:

1. **Given** un técnico y reportes abiertos, **When** consulta la lista, **Then** ve los reportes con identificador, categoría, prioridad, fecha, estado y responsable cuando exista.
2. **Given** un reporte sin responsable, **When** el técnico selecciona "Asignarme", **Then** el reporte queda asociado a ese técnico y conserva su estado actual.
3. **Given** un reporte asignado, **When** el técnico lo marca "En proceso" y posteriormente "Resuelto", **Then** el sistema registra cada cambio y muestra el estado vigente.
4. **Given** un reporte resuelto, **When** alguien intenta devolverlo a un estado no permitido, **Then** el sistema rechaza la transición y mantiene el estado "Resuelto".

---

### User Story 3 - Consultar el avance de un reporte (Priority: P1)

Como usuario, quiero consultar el estado y responsable de mi reporte para saber si fue recibido, si está siendo atendido o si ya fue resuelto.

**Why this priority**: La visibilidad del avance reduce la incertidumbre y evita consultas repetitivas al personal de soporte.

**Independent Test**: Puede probarse consultando un reporte propio después de cada cambio de estado y comprobando que la información refleje el último avance.

**Acceptance Scenarios**:

1. **Given** un usuario con reportes registrados, **When** consulta su lista de reportes, **Then** ve cada reporte con estado actual, prioridad, categoría y fecha de actualización.
2. **Given** un reporte propio que cambia de estado, **When** el usuario vuelve a consultarlo, **Then** observa el nuevo estado y el técnico asignado, si existe.
3. **Given** un usuario que intenta consultar un reporte de otra persona, **When** solicita ese reporte, **Then** el sistema no revela sus detalles.

---

### User Story 4 - Configurar categorías de incidentes (Priority: P2)

Como administrador, quiero crear, editar, activar o desactivar categorías para adaptar Nexo a las necesidades de distintas organizaciones.

**Why this priority**: La configuración permite reutilizar la mesa de ayuda sin depender de categorías fijas y facilita clasificar los incidentes de cada organización.

**Independent Test**: Puede probarse administrando una categoría y verificando que las categorías activas aparezcan al registrar nuevos incidentes, mientras las inactivas no puedan seleccionarse.

**Acceptance Scenarios**:

1. **Given** un administrador, **When** crea una categoría con nombre válido, **Then** la categoría queda disponible para nuevos reportes.
2. **Given** una categoría activa, **When** el administrador la desactiva, **Then** deja de aparecer para nuevos reportes y se conserva en los reportes históricos.
3. **Given** una categoría utilizada por reportes existentes, **When** el administrador intenta eliminarla, **Then** el sistema evita perder la clasificación histórica y ofrece desactivarla en su lugar.
4. **Given** un usuario sin permisos administrativos, **When** intenta modificar categorías, **Then** el sistema rechaza la acción.

### Edge Cases

- Si la descripción excede el límite permitido, el sistema informa el límite y solicita corregirla antes de guardar.
- Si no existen categorías activas, el formulario de reporte informa que el administrador debe configurar al menos una categoría.
- Si dos técnicos intentan asignarse simultáneamente el mismo reporte, solo uno queda como responsable y el otro recibe un mensaje de que el reporte ya fue asignado.
- Si un reporte no tiene técnico asignado, el usuario puede consultar su estado y el sistema muestra que está pendiente de asignación.
- Si se pierde la conexión antes de confirmar una operación, el sistema informa que no pudo completarla y no muestra la operación como realizada.
- Si se intenta registrar una prioridad o estado fuera de los valores permitidos, el sistema rechaza el valor y conserva la información anterior.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST permitir que un usuario autenticado registre un incidente indicando una categoría activa, una prioridad y una descripción.
- **FR-002**: El sistema MUST validar que la categoría, la prioridad y la descripción estén presentes antes de crear un reporte.
- **FR-003**: El sistema MUST asignar a cada reporte un identificador único, fecha de creación y estado inicial "Abierto".
- **FR-004**: El sistema MUST permitir que los técnicos consulten una lista de reportes y la filtren por estado, prioridad, categoría y responsable.
- **FR-005**: El sistema MUST permitir que un técnico se asigne un reporte que no tenga responsable y mostrar el responsable vigente.
- **FR-006**: El sistema MUST permitir transiciones de estado entre "Abierto", "En proceso" y "Resuelto", respetando únicamente las transiciones válidas.
- **FR-007**: El sistema MUST registrar la fecha y el responsable de cada cambio de estado para conservar la trazabilidad del reporte.
- **FR-008**: El sistema MUST permitir que un usuario consulte únicamente sus propios reportes, incluyendo estado, prioridad, categoría, fecha de actualización y técnico asignado cuando exista.
- **FR-009**: El sistema MUST impedir que un usuario sin permisos de administrador modifique las categorías.
- **FR-010**: El sistema MUST permitir que un administrador cree, edite, active y desactive categorías.
- **FR-011**: El sistema MUST impedir que la desactivación de una categoría elimine o altere la categoría registrada en reportes históricos.
- **FR-012**: El sistema MUST informar claramente los errores de validación, permisos, conflictos de asignación y fallas de operación sin presentar una acción fallida como completada.
- **FR-013**: El sistema MUST aplicar controles de acceso diferenciados para usuarios, técnicos y administradores.

### Key Entities

- **Usuario**: Persona que reporta incidentes y consulta el avance de sus propios reportes; incluye identidad y rol.
- **Técnico**: Usuario con permiso para consultar, asumir y actualizar reportes asignados o disponibles.
- **Administrador**: Usuario con permiso para configurar categorías y administrar la operación de la mesa de ayuda.
- **Reporte**: Incidente registrado por un usuario; incluye identificador, categoría, prioridad, descripción, estado, fechas, creador y técnico responsable.
- **Categoría**: Clasificación configurable de incidentes, con nombre y estado activo o inactivo.
- **Historial de estado**: Registro de los cambios de estado de un reporte, incluyendo estado anterior, estado nuevo, fecha y persona que realizó el cambio.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Al menos el 90% de los usuarios de prueba puede registrar un incidente válido en menos de 3 minutos sin asistencia.
- **SC-002**: Al menos el 95% de los reportes válidos queda visible para los técnicos con estado "Abierto" en menos de 10 segundos después de su registro.
- **SC-003**: Un técnico puede localizar un reporte por identificador, estado, prioridad o categoría en menos de 30 segundos en al menos el 90% de las pruebas.
- **SC-004**: El 100% de los cambios de estado realizados durante las pruebas queda reflejado en la consulta del usuario y en el historial del reporte.
- **SC-005**: El 100% de las pruebas de control de acceso impide que un usuario consulte reportes ajenos o que un usuario no administrador modifique categorías.
- **SC-006**: Un administrador puede adaptar el conjunto de categorías activas de una nueva organización en menos de 5 minutos, sin modificar reportes históricos.
- **SC-007**: Al menos el 85% de los usuarios de prueba califica como clara la información mostrada sobre el estado y el responsable de su reporte.

## Assumptions

- La solución contará con autenticación existente o disponible para identificar usuarios y sus roles; el diseño del mecanismo de autenticación no forma parte de esta funcionalidad.
- Los roles iniciales son usuario, técnico y administrador, y cada cuenta pertenece a una sola organización.
- Las prioridades disponibles por defecto son "Baja", "Media", "Alta" y "Crítica"; el alcance inicial no incluye prioridades configurables.
- Los estados permitidos son "Abierto", "En proceso" y "Resuelto"; el alcance inicial no incluye reapertura ni cancelación de reportes.
- Los usuarios necesitan una conexión estable para registrar y consultar información.
- Los reportes históricos se conservan durante la vida operativa de la organización y las categorías utilizadas no se eliminan físicamente.
- Las notificaciones automáticas por correo o mensajes no forman parte del alcance inicial; el usuario consulta el avance dentro de Nexo.
