# Base de datos de Nexo

Requiere PostgreSQL 18 o superior (usa `uuidv7()`). La base local esperada es `nexobd`.

## Instalación desde cero

Desde esta carpeta, en PowerShell:

```powershell
psql -d nexobd -f schema.sql
psql -d nexobd -f seed.sql
```

Para borrar y recrear todo:

```powershell
psql -d nexobd -f reset.sql
```

## Migraciones

`schema.sql` siempre representa el esquema completo y vigente. Las bases creadas con versiones anteriores se actualizan ejecutando, en orden, los scripts de `migrations/` (todos son idempotentes):

| Script | Spec | Cambio |
|---|---|---|
| `migrations/002_resolution_notes.sql` | [002](../../specs/002-ciclo-vida-reportes/spec.md) | Columna `resolution_notes` con longitud 5–2000 |

```powershell
psql -d nexobd -f migrations/002_resolution_notes.sql
```

La aplicación **nunca** ejecuta DDL en tiempo de ejecución (constitución, principio V).

## Usuarios de demostración

Todos usan la contraseña `Nexo123!`. Son datos ficticios solo para desarrollo local.

| Organización (`slug`) | Correo | Rol |
|---|---|---|
| `utmach` | `user@example.test` | USER |
| `utmach` | `maria.rodriguez@utmach.edu.ec` | USER |
| `utmach` | `tech@example.test` | TECHNICIAN |
| `utmach` | `andrea.jaramillo@utmach.edu.ec` | TECHNICIAN |
| `techcorp` | `david.perez@techcorp.io` | USER |
| `techcorp` | `sofia.castro@techcorp.io` | USER |
| `techcorp` | `alex.valdez@techcorp.io` | TECHNICIAN |

`seed.sql` es idempotente: organizaciones, usuarios y categorías usan `ON CONFLICT DO NOTHING` y los reportes de ejemplo solo se insertan si la organización aún no tiene reportes.
