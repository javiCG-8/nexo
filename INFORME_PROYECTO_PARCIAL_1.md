# INFORME ACADÉMICO Y TÉCNICO DE PROYECTO - PRIMER PARCIAL
**Asignatura**: Programación Móvil / Web  
**Organización**: Universidad Técnica de Machala (UTMACH)  
**Proyecto**: Nexo - Mesa de Ayuda TI Multi-Organización con Spec Driven Development (SDD) y DevOps  
**Estudiantes**: Javier C. & Equipo  
**Formato**: Normas APA 7  

---

## 1. INTRODUCCIÓN (Aprendizaje Basado en Problemas)

### 1.1 Situación Problemática Diagnóstico
En la industria actual del software en Ecuador, un porcentaje considerable de empresas medianas, pequeñas y startups enfrentan severas deficiencias operativas en su ciclo de vida de desarrollo de software (SDLC). Entre los problemas más recurrentes se encuentran:
1. **Pérdida y sobrescritura de versiones de código**: Uso informal de copias de seguridad locales (carpetas `v1`, `v2_final`, etc.) en lugar de control de versiones distribuido.
2. **Desorganización en el trabajo colaborativo**: Falta de aislamiento de características (*feature branches*), ausencia de *Code Reviews* y colisiones constantes durante la integración.
3. **Frecuencia elevada de errores en producción**: Inexistencia de pruebas automatizadas (*Unit/Integration Testing*) y validaciones previas al despliegue.
4. **Ausencia de documentación técnica**: Requisitos volátiles y no documentados que generan ambigüedad entre lo que el cliente solicita y lo que el equipo construye.
5. **Obsolescencia metodológica y falta de automatización**: Procesos de compilación y despliegue manuales, propensos al error humano.

### 1.2 Reto Tecnológico Propuesto
Diseñar e implementar un modelo moderno de desarrollo de software para la organización/empresa **Nexo**, integrando **Spec Driven Development (SDD)**, **GitHub Spec Kit**, **GitHub Flow** (comparado con Git Flow y Trunk-Based Development), **GitHub Actions (CI/CD)** y **GitHub Copilot / Inteligencia Artificial Generativa**.

---

## 2. DESARROLLO TEÓRICO-PRÁCTICO (BLOQUES 1 A 7)

### 🔹 BLOQUE 1: Control de Versiones Distribuido
* **Git Avanzado**: Utilización del grafo de commits inmutable, comandos de reescritura segura (`git rebase`), resolución limpia de conflictos y firmado de commits.
* **Flujo de Trabajo (Git Flow vs. Trunk-Based Development)**:
  * *Git Flow*: Ideal para lanzamientos estructurados por versiones, utilizando ramas `main`, `develop`, `feature/*`, `release/*` y `hotfix/*`.
  * *Trunk-Based Development*: todos integran en `main` varias veces al día, normalmente con *feature flags*; exige una suite de pruebas muy madura.
  * *GitHub Flow* (**adoptado en Nexo**): `main` siempre desplegable y cada cambio en una rama corta (`feat/reportes-ciclo-vida`, `feat/seguridad-api`, `ci/pipeline-cicd`) que vuelve a `main` mediante un Pull Request validado por el pipeline. Es la variante práctica de Trunk-Based para un equipo pequeño y evita mantener una rama `develop`. Ver `docs/FLUJO_DE_TRABAJO.md`.

### 🔹 BLOQUE 2: Trabajo Colaborativo en GitHub
* **Pull Requests (PR)**: Mecanismo central para la integración de código donde cada nueva característica es aislada y sometida a revisión.
* **Code Review y Branch Protection Rules**: cada PR usa una plantilla con checklist (especificación, pruebas, multi-tenant, validación, secretos y accesibilidad) y `CODEOWNERS` solicita al revisor automáticamente. Se documenta la regla de protección de `main` que exige aprobación y los checks del pipeline en verde antes del *merge*.

### 🔹 BLOQUE 3: Desarrollo Basado en Especificaciones (Spec Driven Development - SDD)
* **Filosofía SDD**: Paradigma donde las especificaciones técnicas (`spec.md`), planes de implementación (`plan.md`), modelos de datos (`data-model.md`) y listas de tareas (`tasks.md`) se convierten en artefactos vivos de código que guían tanto a desarrolladores como a herramientas de IA.
* **GitHub Spec Kit**: Herramienta de estandarización que automatiza la creación de especificadores, contratos de API (`contracts/rest-api.md`) y verificaciones formales antes de escribir una sola línea de código fuente.

### 🔹 BLOQUE 4: DevOps e Integración Continua (CI/CD)
* **CI/CD con GitHub Actions**: Implementación del flujo de automatización en `.github/workflows/ci.yml`.
* **Pipeline build → test → deploy**: en cada Pull Request y en cada push a `main` se ejecutan, con Node.js 24:
  1. **Backend**: instalación reproducible (`npm ci`), compilación TypeScript, 38 pruebas unitarias y de contrato con cobertura mínima del 80 % (actual ≈ 89 % de líneas) y `npm audit`.
  2. **Integración**: un contenedor **PostgreSQL 18** recibe el esquema, la migración y el seed; 10 pruebas recorren el flujo completo contra la base real (aislamiento entre organizaciones, asignación concurrente, ventana de 5 minutos).
  3. **Frontend**: 20 pruebas con Vitest, `npm audit` y build de producción.
  4. **Deploy**: solo si todo pasó y el cambio está en `main`, se publica la demo en **GitHub Pages**.
* **Seguridad automatizada**: CodeQL (análisis estático) en cada PR y semanalmente; Dependabot abre PRs de actualización de dependencias.

### 🔹 BLOQUE 5: Inteligencia Artificial Aplicada al Desarrollo
* **GitHub Copilot y Asistentes de IA (Antigravity/Gemini 3.6, Claude Code)**: Integración de la IA en todo el SDLC para la generación asistida de especificaciones SDD, refactorización de componentes Angular, creación de controladores Express y aceleración del diseño de pruebas automatizadas.
* **Prompt Engineering para Programadores**: Uso de técnicas de especificación con contexto de sistema, restricciones explícitas, análisis de límites (*Edge Cases*) y arquitectura multi-inquilino.

### 🔹 BLOQUE 6: Calidad de Software y TDD
* **Test Driven Development (TDD)**: Definición previa de casos de prueba fallidos (rojo), desarrollo del código mínimo necesario (verde) y refactorización continua (azul).
* **Pruebas en Pipeline**: Integración obligatoria de Jest/Supertest en el backend (unitarias, contrato e integración con PostgreSQL) y Vitest en el frontend; el pipeline bloquea el *merge* si alguna falla.

### 🔹 BLOQUE 7: Gestión de Proyectos Ágiles
* **GitHub Issues & Projects (Kanban)**: Clasificación de tareas mediante etiquetas (`P1`, `MVP`, `frontend`, `backend`), hitos (*Milestones*) e integración del tablero Kanban reflejado dinámicamente en la interfaz de técnicos de Nexo.

---

## 3. APLICACIÓN PRÁCTICA Y SISTEMA "NEXO"

El sistema **Nexo** se construyó siguiendo los lineamientos prácticos exigidos:

1. **Repositorio**: `javiCG-8/nexo` en GitHub, con 10 Pull Requests fusionados en `main` al cierre de la fase de seguridad y ramas adicionales para rediseño, CI/CD y documentación.
2. **Especificaciones (SDD)**: constitución del proyecto y tres especificaciones en `specs/` (001 MVP, 002 ciclo de vida del reporte, 003 seguridad), cada una con `spec.md`, `plan.md` y `tasks.md`.
3. **Frontend en Angular 22**: componentes *standalone*, *signals* y detección de cambios *zoneless*; diseño móvil primero con barra de pestañas y hojas inferiores, tema claro/oscuro, accesibilidad WCAG 2.1 AA (foco visible, diálogos nativos, prioridad no dependiente solo del color) e instalable como PWA.
4. **Backend en Node.js + Express 5 + TypeScript** sobre **PostgreSQL 18**, con aislamiento por `organization_id` en el código y en claves foráneas compuestas.
5. **Pipeline CI/CD** en `.github/workflows/ci.yml` (build → test → deploy) y demo pública en GitHub Pages.

### 3.1 Seguridad aplicada

Una auditoría basada en OWASP Top 10 (2021) y OWASP API Security Top 10 (2023) identificó 12 hallazgos (spec 003). Se corrigieron, entre otros: el token guardado en `localStorage` (ahora cookie `HttpOnly` y `SameSite=Strict`), la verificación JWT sin algoritmo/emisor/audiencia fijados, el login sin límite de intentos, la enumeración de usuarios por tiempo de respuesta, un filtro XSS basado en expresiones regulares (reemplazado por validación estricta con esquemas), DDL ejecutado desde el código y un bucle infinito de redirecciones en el frontend.

### 3.2 Diseño de experiencia (UX/UI)

Se definió un sistema de diseño propio (tokens de color con contraste AA, tipografía Geist, componentes reutilizables). Las decisiones responden a los usuarios reales: el usuario ve una cuenta regresiva del tiempo que le queda para editar su reporte; el técnico ve indicadores que filtran su bandeja ("sin asignar", "míos") y puede alternar entre lista y tablero Kanban; al resolver, la interfaz exige describir la solución, que luego ve el usuario.

---

## 4. PROPUESTA DE SOLUCIÓN INTEGRAL PARA LA EMPRESA

Para resolver los 5 problemas de la empresa evaluada, se propone la siguiente implementación en 4 fases:

```
[Fase 1: Git & GitHub Spec Kit] ──> [Fase 2: SDD & Prompt Eng.] ──> [Fase 3: GitHub Actions CI/CD] ──> [Fase 4: TDD & Code Review]
```

1. **Estandarización del Control de Versiones**: Prohibir copias manuales e instituir Trunk-Based Development con reglas de protección en `main`.
2. **Adopción de Spec Driven Development**: Exigir que toda nueva característica inicie con su carpeta `/specs/` validada mediante GitHub Spec Kit antes de codificar.
3. **Automatización CI/CD**: Impedir el *merge* de cualquier Pull Request que no pase el pipeline automatizado de GitHub Actions.
4. **Cultura de Calidad e IA**: Capacitar a los desarrolladores en *Prompt Engineering* asistido por GitHub Copilot y prácticas de TDD.

---

## 5. RESPUESTAS A LAS PREGUNTAS DE REFLEXIÓN (CIERRE)

1. **¿Qué problema resuelve Git en el desarrollo real?**  
   Git elimina la incertidumbre y la pérdida de código al proporcionar un registro histórico inmutable y distribuido de cada cambio. Permite que múltiples desarrolladores trabajen simultáneamente en diferentes características sin sobreescribir el trabajo ajeno, facilitando auditorías, reversiones instantáneas (*rollback*) y el rastreo exacto del origen de cualquier error.

2. **¿Por qué DevOps es importante en la actualidad?**  
   DevOps elimina la barrera tradicional entre el desarrollo y las operaciones. Al automatizar la compilación, las pruebas y los despliegues con herramientas como GitHub Actions, las empresas reducen el tiempo de llegada al mercado (*Time-to-Market*), disminuyen drásticamente los errores humanos en producción y garantizan entregas continuas de alto valor con calidad consistente.

3. **¿Cómo la IA está cambiando la programación?**  
   La Inteligencia Artificial ha transformado al programador de un escritor manual de código a un arquitecto de soluciones y evaluador de lógica. A través de herramientas como GitHub Copilot, la IA acelera la generación de código repetitivo, sugiere optimizaciones, facilita la creación de especificaciones detalladas (SDD) y permite detectar fallos de seguridad o diseño antes de la ejecución.

4. **¿Qué herramienta fue más útil y por qué?**  
   **GitHub Spec Kit junto con el enfoque Spec Driven Development (SDD)** representó la herramienta más determinante. Permitió estructurar los requisitos claros de la organización desde el primer momento, alineando el modelo de datos, la API REST y la interfaz de usuario en Angular sin ambigüedades, lo que aceleró la implementación y aseguró que cada componente cumpliera estrictamente con los criterios de aceptación.

---

## 6. REFERENCIAS (FORMATO APA 7)

* Beck, K. (2003). *Test-Driven Development: By Example*. Addison-Wesley Professional.
* Fowler, M. (2018). *Refactoring: Improving the Design of Existing Code* (2nd ed.). Addison-Wesley Professional.
* GitHub. (2024). *GitHub Actions Documentation: Building and testing Node.js*. GitHub Docs. https://docs.github.com/en/actions
* Humble, J., & Farley, D. (2010). *Continuous Delivery: Reliable Software Releases through Build, Test, and Deployment Automation*. Addison-Wesley Professional.
* Spec Driven Development Community. (2024). *Spec Driven Development: Modern SDLC methodology*. https://specdriven.ai/
* GitHub. (2024). *GitHub flow*. GitHub Docs. https://docs.github.com/en/get-started/using-github/github-flow
* OWASP Foundation. (2021). *OWASP Top 10:2021*. https://owasp.org/Top10/
* OWASP Foundation. (2023). *OWASP API Security Top 10 2023*. https://owasp.org/API-Security/
* W3C. (2018). *Web Content Accessibility Guidelines (WCAG) 2.1*. https://www.w3.org/TR/WCAG21/
