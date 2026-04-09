# Informe Técnico: Sistema de Gestión de Asistencia COBACAM

---

## Portada

**Título del Proyecto:** Sistema de Gestión de Asistencia COBACAM

**Institución:** Colegio de Bachilleres del Estado de Campeche (COBACAM) - Plantel 10 Chicbul

**Descripción:** Documento técnico que detalla la arquitectura, funcionalidades y estructura del código del sistema web para la gestión de asistencia de alumnos.

**Fecha:** Octubre 2023

---

## Presentación

El presente documento tiene como finalidad exponer de manera detallada el trabajo de desarrollo realizado para la creación del "Sistema de Gestión de Asistencia COBACAM". A lo largo de estas secciones, se describirá el propósito del sistema, su alcance, las funcionalidades implementadas en cada uno de sus módulos y la estructura general del código fuente que lo compone.

Este informe está diseñado para servir como una guía de referencia tanto para los usuarios administradores del sistema como para futuros desarrolladores que puedan dar mantenimiento o ampliar sus capacidades.

---

## Índice

1.  [Introducción](#1-introducción)
    *   [1.1. Arquitectura del Sistema](#11-arquitectura-del-sistema)
2.  [Desarrollo: Descripción de Módulos](#2-desarrollo-descripción-de-módulos)
    *   [2.1. Panel de Control (Dashboard)](#21-panel-de-control-dashboard)
    *   [2.2. Gestión de Alumnos](#22-gestión-de-alumnos)
    *   [2.3. Historial de Asistencia](#23-historial-de-asistencia)
    *   [2.4. Consulta de Reportes](#24-consulta-de-reportes)
    *   [2.5. Registro Manual](#25-registro-manual)
3.  [Conclusión](#3-conclusión)
4.  [Anexo: Estructura del Código Fuente](#4-anexo-estructura-del-código-fuente)

---

## 1. Introducción

El Sistema de Gestión de Asistencia COBACAM nace de la necesidad de modernizar y automatizar el seguimiento de la asistencia de los estudiantes del Plantel 10 Chicbul. El método tradicional de registro manual es propenso a errores, consume tiempo y dificulta la obtención de datos consolidados para la toma de decisiones y la comunicación con los padres de familia.

El objetivo principal de este proyecto es ofrecer una plataforma web centralizada, intuitiva y eficiente que permita:

*   **Automatizar el registro** de entradas y salidas de alumnos mediante un sistema biométrico (lector de huella).
*   **Proporcionar una visión en tiempo real** del estado de asistencia del plantel.
*   **Facilitar la administración** del catálogo de alumnos.
*   **Generar reportes de asistencia** detallados y exportables (diarios, mensuales e individuales).
*   **Gestionar excepciones** como justificaciones, permisos y registros manuales de forma documentada.
*   **Mejorar la comunicación** con los tutores mediante el envío de notificaciones (funcionalidad subyacente).

Este sistema está construido con tecnologías web modernas, asegurando una experiencia de usuario fluida, segura y escalable.

### 1.1. Arquitectura del Sistema

El sistema se basa en una arquitectura de tres componentes principales que trabajan en conjunto:

1.  **Aplicación Web (Frontend):** Desarrollada en Next.js, esta es la interfaz principal para los administradores. Su función es visualizar datos, generar reportes y gestionar la información de los alumnos. No escribe datos directamente, solo los lee desde la base de datos.

2.  **Base de Datos en la Nube (Google Firestore):** Actúa como el cerebro y la única fuente de verdad del sistema. Almacena de forma segura y centralizada las colecciones de `alumnos` y `asistencias`.

3.  **Backend de Captura (Raspberry Pi):** Un script de Python se ejecuta en un dispositivo físico (Raspberry Pi) en el plantel. Este script está conectado a un lector de huellas dactilares y es el único componente con permisos para escribir en la base de datos. Su responsabilidad es capturar la huella, identificar al alumno y registrar el evento de asistencia en Firestore.

Esta arquitectura desacoplada garantiza que cada componente tenga una única responsabilidad, haciendo el sistema más robusto, seguro y escalable.

---

## 2. Desarrollo: Descripción de Módulos

La aplicación se organiza en cinco módulos principales, cada uno diseñado para cumplir un conjunto específico de tareas.

### 2.1. Panel de Control (Dashboard)

Es la página de inicio y el centro neurálgico del sistema. Ofrece una vista panorámica y en tiempo real de la actividad diaria del plantel.

*   **Propósito:** Brindar a los administradores un resumen visual e inmediato de los indicadores más importantes del día.
*   **Funcionalidades Clave:**
    *   **Tarjetas de Estadísticas:** Cuatro tarjetas que muestran: el total de alumnos inscritos, el número de alumnos presentes hoy, el total de eventos (entradas/salidas) del día y el conteo de notificaciones enviadas.
    *   **Registro de Asistencia en Vivo:** Una lista que se actualiza en tiempo real con los últimos 10 registros de entrada o salida, mostrando el nombre del alumno y hace cuánto tiempo ocurrió el evento.
    *   **Registro de Notificaciones:** Un panel que informa sobre el estado de las notificaciones de WhatsApp enviadas a los tutores, indicando si el envío fue exitoso o fallido y por qué.

### 2.2. Gestión de Alumnos

Este módulo es el catálogo digital de todos los estudiantes del plantel.

*   **Propósito:** Centralizar la información de los alumnos y gestionar el estado de su registro biométrico.
*   **Funcionalidades Clave:**
    *   **Tabla de Alumnos:** Muestra una lista completa de los estudiantes con su nombre, matrícula, grupo, comunidad y teléfono del tutor. Incluye filtros para buscar por nombre y grupo.
    *   **Registro de Nuevos Alumnos:** Un formulario emergente permite añadir nuevos estudiantes al sistema de forma rápida.
    *   **Gestión de Huella Dactilar:** Una columna indica visualmente si la huella de un alumno está "Registrada" o "Pendiente". Para los pendientes, un menú de acciones permite iniciar un proceso de enrolamiento simulado que actualiza el estado en tiempo real.

### 2.3. Historial de Asistencia

El módulo más robusto para el seguimiento y la auditoría de la asistencia.

*   **Propósito:** Permitir la consulta detallada de los registros de asistencia de cualquier fecha y la exportación de datos consolidados.
*   **Funcionalidades Clave:**
    *   **Calendario Interactivo:** Permite al usuario seleccionar cualquier día para ver los registros correspondientes. Los días con registros tienen un indicador visual.
    *   **Visualización por Pestañas:**
        *   **Presentes:** Lista los alumnos que tuvieron un registro de entrada ese día, mostrando hora de entrada y salida.
        *   **Ausentes:** Lista los alumnos que no registraron entrada, facilitando el contacto con el tutor.
        *   **Manuales:** Consolida todas las entradas, salidas, justificaciones y permisos que se hayan registrado manualmente.
    *   **Exportación a Excel:** Un menú desplegable ofrece tres tipos de reportes:
        *   **Exportar Asistencia del Día:** Genera un archivo Excel con la lista de presentes, separados por grupo.
        *   **Exportar Ausentes del Día:** Genera un reporte específico de los alumnos ausentes, incluyendo datos de contacto del tutor y organizado por grupo.
        *   **Exportar Reporte Mensual:** Crea un reporte avanzado del mes seleccionado, con una hoja de resumen estadístico y hojas de detalle por grupo.

### 2.4. Consulta de Reportes

Módulo de búsqueda avanzada para análisis históricos e individuales.

*   **Propósito:** Facilitar la localización rápida del historial de asistencia de uno o varios alumnos específicos.
*   **Funcionalidades Clave:**
    *   **Búsqueda Avanzada:** Permite filtrar alumnos por matrícula, nombre, grupo o comunidad.
    *   **Vista de Resultados:** Muestra una lista de los alumnos que coinciden con la búsqueda.
    *   **Reporte Individual Detallado:** Al seleccionar un alumno, se muestra una vista completa de su historial de asistencia, con un navegador para cambiar entre meses y ver cada entrada y salida.
    *   **Exportación de Reporte Completo:** Genera un archivo de Excel con todo el historial del alumno seleccionado, organizado en una hoja de cálculo por cada mes.

### 2.5. Registro Manual

Diseñado para gestionar las excepciones y casos especiales del día a día, que no son capturados por el sistema automático.

*   **Propósito:** Ofrecer una herramienta flexible para que los administradores puedan justificar ausencias, registrar permisos o corregir olvidos en el registro de huella.
*   **Funcionalidades Clave:**
    *   **Panel de Acceso Rápido:** Muestra dos listas para el día actual: los alumnos que no han registrado entrada (ausentes) y los registros manuales que ya se han hecho hoy.
    *   **Búsqueda de Alumno:** Permite buscar a cualquier estudiante para añadirle un registro, incluso si ya marcó su asistencia.
    *   **Formulario de Registro Flexible:** Permite añadir 4 tipos de registros:
        1.  **Entrada/Salida Manual:** Para corregir olvidos.
        2.  **Justificar Ausencia:** Documenta una falta de día completo (no afecta conteos).
        3.  **Registrar Permiso:** Documenta una salida temporal (no afecta conteos).
    *   **Justificación Opcional:** Permite añadir un motivo para cada registro manual, asegurando que toda excepción quede documentada.

---

## 3. Conclusión

El Sistema de Gestión de Asistencia COBACAM es una solución integral que transforma un proceso manual y tedioso en un flujo de trabajo digital, ágil y centralizado. A través de sus módulos interconectados, la plataforma no solo automatiza la recolección de datos, sino que también proporciona herramientas de alto valor para el análisis, la generación de reportes y la gestión proactiva de la asistencia estudiantil.

El sistema está preparado para reducir significativamente la carga administrativa, mejorar la precisión de los datos y fortalecer la comunicación entre el plantel y los tutores, contribuyendo positivamente al entorno educativo del COBACAM Plantel 10 Chicbul.

---

## 4. Anexo: Estructura del Código Fuente

El código fuente completo del proyecto está organizado en la estructura de carpetas y archivos del mismo. No se adjunta directamente en este documento por su extensión, pero a continuación se listan los archivos principales correspondientes a cada módulo para referencia técnica.

La aplicación está desarrollada con Next.js y React, utilizando TypeScript para garantizar la calidad y mantenibilidad del código. Los componentes de la interfaz de usuario son de la librería `shadcn/ui` y el estilo se gestiona con `Tailwind CSS`.

*   **Página Principal / Layout:**
    *   `src/app/layout.tsx`: Plantilla principal de la aplicación.
    *   `src/components/layout/sidebar.tsx`: Componente de la barra de navegación lateral.
    *   `src/components/layout/header.tsx`: Componente del encabezado.

*   **Módulo: Panel de Control**
    *   `src/app/page.tsx`: Lógica y estructura de la página del dashboard.
    *   `src/components/dashboard/stat-card.tsx`: Tarjetas de estadísticas.
    *   `src/components/dashboard/attendance-feed.tsx`: Feed de asistencia en vivo.

*   **Módulo: Gestión de Alumnos**
    *   `src/app/students/page.tsx`: Página principal del módulo.
    *   `src/app/students/data-table.tsx`: Componente de la tabla de datos.
    *   `src/app/students/columns.tsx`: Definición de las columnas de la tabla.
    *   `src/app/students/student-form.tsx`: Formulario para añadir nuevos alumnos.
    *   `src/app/students/enroll-fingerprint-dialog.tsx`: Diálogo para el registro de huella.

*   **Módulo: Historial de Asistencia**
    *   `src/app/attendance/page.tsx`: Página principal del módulo de asistencia.
    *   `src/app/attendance/attendance-calendar.tsx`: Componente del calendario.
    *   `src/app/attendance/daily-attendance-list.tsx`: Lista de alumnos presentes.
    *   `src/app/attendance/daily-absence-list.tsx`: Lista de alumnos ausentes.

*   **Módulo: Consulta de Reportes**
    *   `src/app/reports/page.tsx`: Página de búsqueda y resultados.
    *   `src/app/reports/student-report-card.tsx`: Tarjeta con el informe individual del alumno.

*   **Módulo: Registro Manual**
    *   `src/app/manual-entry/page.tsx`: Página principal del módulo.
    *   `src/app/manual-entry/manual-entry-form.tsx`: Formulario para crear un nuevo registro manual.

*   **Datos y Tipos (Simulación)**
    *   `src/lib/data.ts`: Script que genera los datos de prueba para la aplicación.
    *   `src/lib/types.ts`: Definiciones de los tipos de datos (Student, Attendance, etc.).
