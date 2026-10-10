# Base de datos de Nexo

La base local esperada es `nexobd` y PostgreSQL debe ser la versión 18 o superior para disponer de `uuidv7()`.

Desde esta carpeta, ejecutar en PowerShell:

```powershell
psql -d nexobd -f schema.sql
psql -d nexobd -f seed.sql
```

Para borrar y recrear todo:

```powershell
psql -d nexobd -f reset.sql
```

Los usuarios de prueba usan la contraseña `Nexo123!`:

| Organización | Usuario | Rol |
|---|---|---|
| UTMACH | usuario@utmach.edu.ec | USER |
| UTMACH | tecnico@utmach.edu.ec | TECHNICIAN |
| Empresa Demo | usuario@empresa-demo.test | USER |
| Empresa Demo | tecnico@empresa-demo.test | TECHNICIAN |

El script `seed.sql` es idempotente para organizaciones, usuarios y categorías.
