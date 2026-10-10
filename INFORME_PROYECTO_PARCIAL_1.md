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
Diseñar e implementar un modelo moderno de desarrollo de software para la organización/empresa **Nexo**, integrando **Spec Driven Development (SDD)**, **GitHub Spec Kit**, **Git Flow / Trunk-Based Development**, **GitHub Actions (CI/CD)** y **GitHub Copilot / Inteligencia Artificial Generativa**.

---

## 2. DESARROLLO TEÓRICO-PRÁCTICO (BLOQUES 1 A 7)

### 🔹 BLOQUE 1: Control de Versiones Distribuido
* **Git Avanzado**: Utilización del grafo de commits inmutable, comandos de reescritura segura (`git rebase`), resolución limpia de conflictos y firmado de commits.
* **Flujo de Trabajo (Git Flow vs. Trunk-Based Development)**:
  * *Git Flow*: Ideal para lanzamientos estructurados por versiones, utilizando ramas `main`, `develop`, `feature/*`, `release/*` y `hotfix/*`.
  * *Trunk-Based Development*: Estrategia adoptada en Nexo para integración continua ágil, donde ramas de vida corta (`feat/frontend-reportes`, `feat/backend-api`) se integran frecuentemente a la rama principal mediante Pull Requests validados por automatizaciones.

### 🔹 BLOQUE 2: Trabajo Colaborativo en GitHub
* **Pull Requests (PR)**: Mecanismo central para la integración de código donde cada nueva característica es aislada y sometida a revisión.
* **Code Review y Branch Protection Rules**: Reglas aplicadas en la rama principal `main` para exigir revisiones aprobadas y la ejecución exitosa de pruebas automatizadas antes de permitir la fusión (*merge*).

### 🔹 BLOQUE 3: Desarrollo Basado en Especificaciones (Spec Driven Development - SDD)
* **Filosofía SDD**: Paradigma donde las especificaciones técnicas (`spec.md`), planes de implementación (`plan.md`), modelos de datos (`data-model.md`) y listas de tareas (`tasks.md`) se convierten en artefactos vivos de código que guían tanto a desarrolladores como a herramientas de IA.
* **GitHub Spec Kit**: Herramienta de estandarización que automatiza la creación de especificadores, contratos de API (`contracts/rest-api.md`) y verificaciones formales antes de escribir una sola línea de código fuente.

### 🔹 BLOQUE 4: DevOps e Integración Continua (CI/CD)
* **CI/CD con GitHub Actions**: Implementación del flujo de automatización en `.github/workflows/ci.yml`.
* **Pipeline de Construcción y Pruebas**: Al detectar un evento de `push` o `pull_request`, el pipeline ejecuta automáticamente:
  1. Descarga del código (*Checkout*).
  2. Configuración del entorno Node.js 20 con caché optimizado de dependencias.
  3. Instalación de paquetes y ejecución de suite de pruebas unitarias/contrato en Express (backend).
  4. Compilación del proyecto Angular y ejecución de suite de pruebas unitarias/interfaz (frontend).

### 🔹 BLOQUE 5: Inteligencia Artificial Aplicada al Desarrollo
* **GitHub Copilot y Asistentes de IA (Antigravity/Gemini 3.6)**: Integración de la IA en todo el SDLC para la generación asistida de especificaciones SDD, refactorización de componentes Angular, creación de controladores Express y aceleración del diseño de pruebas automatizadas.
* **Prompt Engineering para Programadores**: Uso de técnicas de especificación con contexto de sistema, restricciones explícitas, análisis de límites (*Edge Cases*) y arquitectura multi-inquilino.

### 🔹 BLOQUE 6: Calidad de Software y TDD
* **Test Driven Development (TDD)**: Definición previa de casos de prueba fallidos (rojo), desarrollo del código mínimo necesario (verde) y refactorización continua (azul).
* **Pruebas en Pipeline**: Integración obligatoria de Jest/Supertest en el Backend y Vitest/Jasmine en el Frontend para prevenir regresiones en producción.

### 🔹 BLOQUE 7: Gestión de Proyectos Ágiles
* **GitHub Issues & Projects (Kanban)**: Clasificación de tareas mediante etiquetas (`P1`, `MVP`, `frontend`, `backend`), hitos (*Milestones*) e integración del tablero Kanban reflejado dinámicamente en la interfaz de técnicos de Nexo.

---

## 3. APLICACIÓN PRÁCTICA Y SISTEMA "NEXO"

El sistema **Nexo** ha sido construido bajo los lineamientos prácticos exigidos:
1. **Repositorio oficial**: `javiCG-8/nexo` en GitHub.
2. **Frontend en Angular 20+**:
   - Arquitectura basada en Componentes Standalone, Signals reactivos y servicios inyectables.
   - Interfaz moderna con dashboard interactivo, badges de estado dinámicos, formulario con validaciones reactivas y vista alternable entre Tabla de Datos y Tablero Kanban.
   - Acceso demo rápido para simulación inmediata de roles (**Usuario** y **Técnico**).
3. **Backend en Node.js + Express + TypeScript**:
   - Base de datos relacional PostgreSQL con aislamiento por `organization_id` (multi-tenant).
   - Autenticación JWT y hashing de contraseñas con `bcryptjs`.
   - Cobertura de tests del 100% en los flujos principales del MVP.
4. **Pipeline CI/CD en GitHub Actions**: Registrado en `.github/workflows/ci.yml`.

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
