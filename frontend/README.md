# Nexo · Frontend

Aplicación Angular 22 (componentes *standalone*, *signals*, detección de cambios *zoneless*).

## Comandos

| Comando | Uso |
|---|---|
| `npm start` | Servidor de desarrollo en http://localhost:4200 (requiere la API en el puerto 3000) |
| `npx ng test --watch=false` | Pruebas unitarias con Vitest |
| `npx ng build` | Build de producción en modo demo (API simulada), como se publica en GitHub Pages |

## Estructura

```
src/app/
├── core/        sesión (cookie HttpOnly), guards por rol, interceptor, reglas compartidas, API demo
├── features/
│   ├── auth/    página de login
│   └── reports/ data (servicio HTTP + store) → ui (componentes) → pages (usuario, técnico)
├── layout/      shell: barra lateral (escritorio), barra superior y pestañas (móvil)
└── shared/ui/   sistema de diseño: hojas sobre <dialog>, toasts, badges, íconos, marca
```

## Sistema de diseño

Los tokens viven en `src/styles.css` (`--bg`, `--surface`, `--text`, `--accent`, estados, radios, sombras). El tema oscuro se aplica automáticamente según el sistema o con el selector de la barra lateral (`data-theme` en `<html>`). Reglas:

- Móvil primero; puntos de corte en 768 px y 1024 px.
- Objetivos táctiles de al menos 44 px y `font-size: 16px` en campos móviles (evita el zoom de iOS).
- Estados que no dependen solo del color: la prioridad se muestra como barras de señal más texto.
- Diálogos con `<dialog>` nativo para obtener foco atrapado, Esc y fondo inerte.

## Entornos

| Archivo | `apiUrl` | `demoMode` |
|---|---|---|
| `environment.ts` (desarrollo) | `http://localhost:3000/api/v1` | `false` |
| `environment.prod.ts` (GitHub Pages) | `/api/v1` | `true`: datos simulados en el navegador |

Cada entorno tiene su propia Content-Security-Policy (`index.html` e `index.prod.html`).
