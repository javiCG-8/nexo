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
* **Frontend**: Angular 20 (Componentes Standalone, Signals reactivos, Kanban visual, Badges de estado).
* **Backend**: Express + TypeScript + PostgreSQL (Multi-organizacional con aislamiento seguro por `organization_id`).
* **Calidad**: Suites de pruebas integradas en el pipeline CI/CD (Jest/Supertest y Vitest).

---

## 💻 DEMOSTRACIÓN PRÁCTICA EN VIVO (PASO A PASO)

### 1. Iniciar el Sistema (Demostración Local)
* En la pantalla de Login, mostrar la marca **Nexo** y usar los botones de **Acceso Rápido**:
  - **Click en "Modo Usuario"**: Muestra el ingreso de `user@example.test` en la organización `utmach`.
  - **Demostración de Usuario**: Crear un nuevo reporte (ej. *"Falla de red en laboratorio 2"*), asignando prioridad `HIGH` y categoría `NETWORK`. Mostrar cómo el reporte pasa a estado `OPEN`.

### 2. Cambio a Rol Técnico
* Cerrar sesión e ingresar con el botón **"Modo Técnico"** (`tech@example.test`).
* **Demostrar la vista de Gestión**:
  - Alternar entre la vista de **Tabla** y el **Tablero Kanban**.
  - Asignarse el reporte recién creado usando el botón **"Asignarme"**.
  - Avanzar el estado de `OPEN` a `IN_PROGRESS` y finalmente a `RESOLVED`.

### 3. Evidencia del Pipeline CI/CD en GitHub
* Abrir el repositorio `javiCG-8/nexo` en GitHub.
* Ir a la pestaña **Actions** para mostrar la ejecución exitosa del workflow **Nexo CI Pipeline** (`.github/workflows/ci.yml`).
* Mostrar la lista de **Pull Requests (#1 a #6)** fusionados correctamente en `main`.

---

## 💡 PREGUNTAS DE REFLEXIÓN (PARA EL CIERRE)

Tener preparadas las respuestas clave exigidas por el docente:
1. **Git**: Resuelve la pérdida de versiones, choques de código y asegura trazabilidad total.
2. **DevOps**: Garantiza que el software se compile, pruebe y despliegue sin fallas humanas en producción.
3. **IA**: Acelera la productividad al escribir pruebas, sugerir arquitecturas y generar documentación SDD.
4. **Herramienta más útil**: **Spec Kit / SDD**, porque alineó los requisitos antes de escribir una sola línea de código.
