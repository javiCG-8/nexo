# Research: Mesa de ayuda TI multi-organización

**Feature**: [spec.md](./spec.md)  
**Scope**: MVP de una semana: crear reportes, listar reportes, asignar técnico y cambiar estado; preparado para reutilización entre organizaciones.

## Decision 1: Aplicación web separada en frontend Angular y API REST Node.js

- **Decision**: Mantener un frontend Angular y un servicio REST Node.js con Express.
- **Rationale**: Separa la experiencia de usuario de las reglas de negocio, permite probar cada parte con Jasmine/Jest y mantiene un límite claro para el MVP.
- **Alternatives considered**: Una aplicación monolítica habría reducido proyectos, pero no cumpliría la tecnología de frontend solicitada.

## Decision 2: Multi-tenancy explícita por organización

- **Decision**: Crear `Organization` y exigir `organizationId` en usuarios, categorías y reportes. La API deriva la organización del usuario autenticado y aplica el filtro en cada consulta.
- **Rationale**: Evita mezclar datos entre organizaciones y permite reutilizar Nexo sin duplicar código.
- **Alternatives considered**: Una base de datos por organización ofrece aislamiento adicional, pero añade operación e infraestructura innecesarias para el tamaño del MVP; una columna nullable no garantiza separación.

## Decision 3: Categorías persistidas y extensibles

- **Decision**: Crear una tabla `Category`, sembrar `COMPUTER` y `NETWORK` por organización, usar `categoryId` en reportes y exponer `GET /categories`. La administración se reserva para una fase posterior.
- **Rationale**: El catálogo deja de estar acoplado al código y permite agregar categorías por organización sin migrar el modelo de reportes.
- **Alternatives considered**: Un enum en código no es reutilizable; una tabla global sin organización permitiría contaminación entre tenants.

## Decision 4: Estados canónicos

- **Decision**: Usar exclusivamente `OPEN`, `IN_PROGRESS` y `RESOLVED` en base de datos, API, frontend, pruebas y documentación.
- **Rationale**: Un vocabulario único evita conversiones y errores entre capas.
- **Alternatives considered**: Etiquetas traducidas almacenadas en base de datos complicarían filtros y contratos; las traducciones pertenecen a la presentación.

## Decision 5: Configuración por variables de entorno

- **Decision**: Leer conexión PostgreSQL, secreto de autenticación, puerto, origen permitido y entorno desde variables de entorno; validar las obligatorias al iniciar.
- **Rationale**: Permite desplegar la misma aplicación en organizaciones y ambientes distintos sin secretos ni valores operativos en el código.
- **Alternatives considered**: Archivos de configuración versionados exponen valores y requieren cambios de código por ambiente.

## Decision 6: Transacciones y aislamiento en operaciones críticas

- **Decision**: Usar transacciones para sembrado, asignación y cambio de estado; aplicar restricciones de clave foránea y unicidad por organización.
- **Rationale**: Evita doble asignación y garantiza que referencias y cambios de estado sean consistentes.
- **Alternatives considered**: Validación solo en frontend o consultas sin transacción no protege ante solicitudes concurrentes.

## Decision 7: Pruebas y entrega automatizada

- **Decision**: Jest/Supertest verificará aislamiento entre organizaciones, categorías activas, estados y permisos; Jasmine verificará selección de categorías y estados visibles; GitHub Actions ejecutará ambas suites y builds.
- **Rationale**: Los límites multi-tenant son riesgos críticos y deben probarse en la API, mientras Angular valida el comportamiento visible.
- **Alternatives considered**: Solo pruebas end-to-end serían más lentas y no aislarían las reglas de acceso.
