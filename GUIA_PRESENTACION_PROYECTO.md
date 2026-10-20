# GUIA DE PRESENTACIÓN Y EXPOSICIÓN - PROYECTO PARCIAL 1
**Asignatura**: Programación Móvil  
**Proyecto**: Nexo - Mesa de Ayuda TI con SDD y DevOps  
**Modalidad**: Presentación oral y demostración práctica en vivo  

---

## 🎯 ESTRUCTURA DE LA PRESENTACIÓN (10 - 15 MINUTOS)

### 📌 Diapositiva 1: Portada e Introducción
* **Título**: Modelo Moderno de Desarrollo de Software basado en SDD, DevOps e IA.
* **Integrantes**: Javier C. & Compañero.
* **Contexto**: Situación problemática en empresas de desarrollo de software en Ecuador (Pérdida de versiones, falta de automatización y documentación).

### 📌 Diapositiva 2: Propuesta Tecnológica y Flujo de Trabajo
* **Arquitectura de Herramientas**:
  * **GitHub & Trunk-Based Development**: Manejo de ramas de vida corta e integración con Pull Requests.
  * **Spec Driven Development (SDD) & GitHub Spec Kit**: Especificación rigurosa en `/specs/` antes de escribir código.
  * **DevOps con GitHub Actions**: Integración continua automatizada para backend y frontend.
  * **Inteligencia Artificial**: Asistencia en la generación de código y especificaciones mediante Prompt Engineering.

### 📌 Diapositiva 3: Arquitectura del Sistema Nexo
* **Frontend**: Angular 22 (standalone, signals, zoneless), móvil primero, tema claro/oscuro, PWA.
* **Backend**: Express + TypeScript + PostgreSQL (Multi-organizacional con aislamiento seguro por `organization_id`).
* **Calidad**: 68 pruebas en el pipeline (Jest/Supertest, integración con PostgreSQL 18 y Vitest) + CodeQL.
* **Seguridad**: cookie HttpOnly, JWT endurecido, límite de intentos, Helmet/CSP (spec 003).

---

## 💻 DEMOSTRACIÓN PRÁCTICA EN VIVO (PASO A PASO)

> Antes de presentar, dejar la base limpia: `psql -d nexobd -f backend/db/reset.sql`.
> Plan B sin servidor: la demo pública en https://javicg-8.github.io/nexo/ (datos simulados).

### 1. Usuario (mostrar en vista móvil: DevTools → modo dispositivo)
* En el login, pulsar la cuenta **Carlos · Usuario**.
* Pestaña **Nuevo** → crear *Falla de red en laboratorio 2*, impacto **Alta**, categoría **Redes**.
* Abrir el reporte: mostrar el progreso del estado y la **cuenta regresiva de 5 minutos** para editar o cancelar.
* Editar la prioridad para demostrar la ventana de edición (spec 002).

### 2. Técnico (vista de escritorio)
* Cerrar sesión e ingresar como **Roberto · Técnico**.
* Pulsar el indicador **Sin asignar** y luego **Asignarme** en el reporte nuevo.
* Volver a la cuenta de usuario y mostrar que ya **no puede editarlo** (bloqueado al asignarse).
* Como técnico, cambiar a **Tablero**, pulsar **Iniciar atención** y luego **Resolver**: la interfaz exige escribir la solución.
* Como usuario, abrir el reporte resuelto y mostrar la **solución aplicada**.
* Cambiar el tema (claro/oscuro) desde la barra lateral.

### 3. Evidencia del proceso en GitHub
* **Pull requests**: lista de PRs fusionados (#1–#4 especificación antes del código; #9 y #10 ciclo de vida y seguridad).
* **Actions**: ejecución del workflow **CI/CD** con sus 4 etapas (backend, integración con PostgreSQL, frontend, deploy).
* **Security → Code scanning**: resultados de CodeQL.
* **specs/**: mostrar `specs/002-ciclo-vida-reportes/spec.md` y la prueba que verifica cada requisito (`backend/tests/api.spec.ts`).

---

## 💡 PREGUNTAS DE REFLEXIÓN (PARA EL CIERRE)

Tener preparadas las respuestas clave exigidas por el docente:
1. **Git**: Resuelve la pérdida de versiones, choques de código y asegura trazabilidad total.
2. **DevOps**: Garantiza que el software se compile, pruebe y despliegue sin fallas humanas en producción.
3. **IA**: Acelera la productividad al escribir pruebas, sugerir arquitecturas y generar documentación SDD.
4. **Herramienta más útil**: **Spec Kit / SDD**, porque alineó los requisitos antes de escribir una sola línea de código.
