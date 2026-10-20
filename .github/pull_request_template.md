## Qué cambia

<!-- Resumen en 2-3 líneas. -->

## Especificación

<!-- Enlace a specs/NNN-.../spec.md y requisitos cubiertos (FR-xxx). Constitución, principio I. -->

- Spec:
- Requisitos:

## Tipo de cambio

- [ ] `feat` nueva funcionalidad
- [ ] `fix` corrección
- [ ] `docs` documentación
- [ ] `ci` / `chore` infraestructura
- [ ] `refactor` sin cambio de comportamiento

## Checklist de revisión

- [ ] La especificación está actualizada antes o junto con el código.
- [ ] Hay pruebas para cada regla nueva (TDD) y el pipeline está en verde.
- [ ] Toda consulta filtra por `organization_id` del token (multi-tenant).
- [ ] La entrada se valida con esquemas; no hay SQL concatenado con datos del usuario.
- [ ] No se versionan secretos ni archivos `.env`.
- [ ] La interfaz funciona en móvil y con teclado; contraste AA.

## Cómo probarlo

<!-- Pasos o capturas. -->
