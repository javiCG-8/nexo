# Feature Specification: Mesa de ayuda de soporte TI

**Feature Branch**: `001-it-support-desk`

**Created**: 2026-10-09

**Status**: Draft

**Input**: User description: "Nexo es una help desk de soporte TI para una organización como la UTMACH o una empresa pequeña. Los usuarios reportan incidentes de computadores o red indicando categoría, prioridad y descripción. Los técnicos ven la lista de reportes, se asignan uno y cambian su estado entre abierto, en proceso y resuelto. El usuario puede consultar cómo va su reporte. Las categorías deben poder configurarse para que Nexo sirva en otros lugares."

**MVP Scope Note**: La primera entrega se limita a crear reportes, listar, asignar técnico y cambiar estado. Las categorías se almacenan por organización en PostgreSQL y se siembran con `COMPUTER` y `NETWORK`; la interfaz para administrarlas queda fuera del MVP, pero el modelo y la API deben admitirla posteriormente.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Reportar un incidente (Priority: P1)

Como usuario de la organización, quiero registrar un incidente de computador o red con su categoría, prioridad y descripción para solicitar soporte y dejar constancia del problema.

**Why this priority**: El registro de incidentes es el punto de entrada indispensable para que la organización pueda organizar y atender solicitudes de soporte.

**Independent Test**: Puede probarse creando un incidente válido y verificando que se genere un reporte consultable con toda la información proporcionada.

**Acceptance Scenarios**:

1. **Given** un usuario autenticado y categorías activas, **When** completa categoría, prioridad y descripción y envía el formulario, **Then** el sistema crea un reporte con identificador único y estado `OPEN`.
2. **Given** un formulario de reporte incompleto, **When** el usuario intenta enviarlo, **Then** el sistema indica los campos faltantes y no crea un reporte.
3. **Given** un usuario que registra un incidente, **When** el reporte es creado, **Then** el usuario puede ver su identificador, fecha, prioridad, categoría y estado inicial `OPEN`.

---

### User Story 2 - Gestionar y atender reportes (Priority: P1)

Como técnico, quiero consultar los reportes pendientes, asignarme uno y actualizar su estado para organizar mi trabajo y comunicar el avance de la atención.

**Why this priority**: Permite convertir los reportes recibidos en trabajo operativo trazable y evita que los incidentes queden sin responsable.

**Independent Test**: Puede probarse con un reporte abierto, asignándolo a un técnico y recorriendo los estados permitidos hasta resolverlo.

**Acceptance Scenarios**:

1. **Given** un técnico y reportes abiertos, **When** consulta la lista, **Then** ve los reportes con identificador, categoría, prioridad, fecha, estado y responsable cuando exista.
2. **Given** un reporte sin responsable, **When** el técnico selecciona "Asignarme", **Then** el reporte queda asociado a ese técnico y conserva su estado actual.
3. **Given** un reporte asignado, **When** el técnico lo marca `IN_PROGRESS` y posteriormente `RESOLVED`, **Then** el sistema registra cada cambio y muestra el estado vigente.
4. **Given** un reporte resuelto, **When** alguien intenta devolverlo a un estado no permitido, **Then** el sistema rechaza la transición y mantiene el estado `RESOLVED`.

---

### User Story 3 - Consultar el avance de un reporte (Priority: P1)

Como usuario, quiero consultar el estado y responsable de mi reporte para saber si fue recibido, si está siendo atendido o si ya fue resuelto.

**Why this priority**: La visibilidad del avance reduce la incertidumbre y evita consultas repetitivas al personal de soporte.

**Independent Test**: Puede probarse consultando un reporte propio después de cada cambio de estado y comprobando que la información refleje el último avance.

**Acceptance Scenarios**:

1. **Given** un usuario con reportes registrados, **When** consulta su lista de reportes, **Then** ve cada reporte con estado actual, prioridad, categoría y fecha de actualización.
2. **Given** un reporte propio que cambia de estado, **When** el usuario vuelve a consultarlo, **Then** observa el nuevo estado (`OPEN`, `IN_PROGRESS` o `RESOLVED`) y el técnico asignado, si existe.
3. **Given** un usuario que intenta consultar un reporte de otra persona, **When** solicita ese reporte, **Then** el sistema no revela sus detalles.

---

### User Story 4 - Preparar categorías configurables (Priority: P2)

Como responsable de una futura administración, quiero que las categorías se almacenen por organización y estén disponibles mediante la API para poder agregar una interfaz de configuración después del MVP.

**Why this priority**: La configuración permite reutilizar la mesa de ayuda sin depender de categorías fijas y facilita clasificar los incidentes de cada organización.

**Independent Test**: Puede probarse verificando que cada organización tenga sus categorías iniciales en PostgreSQL, que la API entregue solo las categorías de la organización autenticada y que un reporte guarde una referencia a la categoría seleccionada.

**Acceptance Scenarios**:

1. **Given** dos organizaciones configuradas, **When** cada una consulta sus categorías, **Then** recibe sus categorías `COMPUTER` y `NETWORK` sin datos de la otra organización.
2. **Given** una categoría activa de la organización del usuario, **When** se registra un reporte, **Then** el reporte conserva una referencia a esa categoría.
3. **Given** una categoría de otra organización, **When** se intenta usar al registrar un reporte, **Then** el sistema rechaza la operación.
4. **Given** la API preparada para administración futura, **When** se revisa el MVP, **Then** no existe una interfaz de usuario para crear, editar, activar o desactivar categorías.

### Edge Cases

- Si la descripción excede el límite permitido, el sistema informa el límite y solicita corregirla antes de guardar.
- Si no existen categorías activas, el formulario de reporte informa que el administrador debe configurar al menos una categoría.
- Si dos técnicos intentan asignarse simultáneamente el mismo reporte, solo uno queda como responsable y el otro recibe un mensaje de que el reporte ya fue asignado.
- Si un reporte no tiene técnico asignado, el usuario puede consultar su estado `OPEN` y el sistema muestra que está pendiente de asignación.
- Si se pierde la conexión antes de confirmar una operación, el sistema informa que no pudo completarla y no muestra la operación como realizada.
- Si se intenta registrar una prioridad o estado fuera de los valores permitidos, el sistema rechaza el valor y conserva la información anterior.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST permitir que un usuario autenticado registre un incidente indicando una categoría activa, una prioridad y una descripción.
- **FR-002**: El sistema MUST validar que la categoría, la prioridad y la descripción estén presentes antes de crear un reporte.
- **FR-003**: El sistema MUST asignar a cada reporte un identificador único, fecha de creación y estado inicial `OPEN`.
- **FR-004**: El sistema MUST permitir que los técnicos consulten una lista de reportes y la filtren por estado, prioridad, categoría y responsable.
- **FR-005**: El sistema MUST permitir que un técnico se asigne un reporte que no tenga responsable y mostrar el responsable vigente.
- **FR-006**: El sistema MUST permitir transiciones de estado entre `OPEN`, `IN_PROGRESS` y `RESOLVED`, respetando únicamente las transiciones válidas.
- **FR-007**: El sistema MUST registrar la fecha y el responsable de cada cambio de estado para conservar la trazabilidad del reporte.
- **FR-008**: El sistema MUST permitir que un usuario consulte únicamente sus propios reportes, incluyendo estado, prioridad, categoría, fecha de actualización y técnico asignado cuando exista.
- **FR-009**: El sistema MUST impedir que un usuario o técnico modifique las categorías desde el MVP, reservando esa operación para una futura autorización administrativa.
- **FR-010**: El sistema MUST persistir categorías por organización, sembrar `COMPUTER` y `NETWORK`, exponerlas para el registro de reportes y mantener el modelo/API preparados para una futura administración.
- **FR-011**: El sistema MUST impedir que la desactivación de una categoría elimine o altere la categoría registrada en reportes históricos.
- **FR-012**: El sistema MUST informar claramente los errores de validación, permisos, conflictos de asignación y fallas de operación sin presentar una acción fallida como completada.
- **FR-013**: El sistema MUST aplicar controles de acceso diferenciados para usuarios y técnicos, y aislar todos los datos por organización.

### Key Entities

- **Organización**: Tenant al que pertenecen usuarios, categorías y reportes.
- **Usuario**: Persona que reporta incidentes y consulta el avance de sus propios reportes; incluye identidad, rol y organización.
- **Técnico**: Usuario con permiso para consultar, asumir y actualizar reportes asignados o disponibles.
- **Reporte**: Incidente registrado por un usuario; incluye identificador, categoría, prioridad, descripción, estado, fechas, creador y técnico responsable.
- **Categoría**: Clasificación configurable de incidentes, con organización, código, nombre y estado activo o inactivo.
- **Historial de estado**: Registro de los cambios de estado de un reporte, incluyendo estado anterior, estado nuevo, fecha y persona que realizó el cambio.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Al menos el 90% de los usuarios de prueba puede registrar un incidente válido en menos de 3 minutos sin asistencia.
- **SC-002**: Al menos el 95% de los reportes válidos queda visible para los técnicos con estado `OPEN` en menos de 10 segundos después de su registro.
- **SC-003**: Un técnico puede localizar un reporte por identificador, estado, prioridad o categoría en menos de 30 segundos en al menos el 90% de las pruebas.
- **SC-004**: El 100% de los cambios de estado realizados durante las pruebas queda reflejado en la consulta del usuario y en el historial del reporte.
- **SC-005**: El 100% de las pruebas de control de acceso impide que un usuario consulte reportes ajenos, que una organización consulte datos de otra o que un usuario/técnico modifique categorías en el MVP.
- **SC-006**: La preparación de una nueva organización, incluyendo sus categorías iniciales `COMPUTER` y `NETWORK`, puede completarse mediante el proceso de inicialización en menos de 5 minutos, sin modificar reportes históricos de otras organizaciones.
- **SC-007**: Al menos el 85% de los usuarios de prueba califica como clara la información mostrada sobre el estado y el responsable de su reporte.

## Assumptions

- La solución contará con autenticación existente o disponible para identificar usuarios y sus roles; el diseño del mecanismo de autenticación no forma parte de esta funcionalidad.
- Los roles iniciales del MVP son usuario y técnico, y cada cuenta pertenece a una sola organización.
- Las prioridades disponibles por defecto son "Baja", "Media", "Alta" y "Crítica"; el alcance inicial no incluye prioridades configurables.
- Los estados permitidos son `OPEN`, `IN_PROGRESS` y `RESOLVED`; el alcance inicial no incluye reapertura ni cancelación de reportes.
- Los usuarios necesitan una conexión estable para registrar y consultar información.
- Los reportes históricos se conservan durante la vida operativa de la organización y las categorías utilizadas no se eliminan físicamente.
- Las notificaciones automáticas por correo o mensajes no forman parte del alcance inicial; el usuario consulta el avance dentro de Nexo.
- La configuración operativa se proporciona mediante variables de entorno y no se guardan secretos en el código fuente.
