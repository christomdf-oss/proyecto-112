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
    *   [2.6. Notificaciones por Correo](#26-notificaciones-por-correo)
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
*   **Optimizar la comunicación** con los tutores mediante notificaciones automáticas por correo electrónico.

Este sistema está construido con tecnologías web modernas, asegurando una experiencia de usuario fluida, segura y escalable.

### 1.1. Arquitectura del Sistema

El sistema se basa en una arquitectura de tres componentes principales que trabajan en conjunto:

1.  **Aplicación Web (Frontend):** Desarrollada en Next.js, esta es la interfaz principal para los administradores. Su función es visualizar datos, generar reportes, gestionar la información de los alumnos y facilitar el envío de notificaciones.

2.  **Base de Datos en la Nube (Google Firestore):** Actúa como el cerebro y la única fuente de verdad del sistema. Almacena de forma segura y centralizada las colecciones de `students` y `asistencias`.

3.  **Backend de Captura (PC de Escritorio):** Un script de Python se ejecuta en un dispositivo físico (PC con Windows) en el plantel. Este script está conectado a un lector de huellas dactilares y es el único componente con permisos para escribir en la base de datos. Su responsabilidad es capturar la huella, identificar al alumno y registrar el evento de asistencia.

Esta arquitectura desacoplada garantiza que cada componente tenga una única responsabilidad, haciendo el sistema más robusto, seguro y escalable.

---

## 2. Desarrollo: Descripción de Módulos

La aplicación se organiza en seis módulos principales.

### 2.1. Panel de Control (Dashboard)

Es la página de inicio y el centro neurálgico del sistema. Ofrece una vista panorámica y en tiempo real de la actividad diaria del plantel.

*   **Propósito:** Brindar a los administradores un resumen visual e inmediato de los indicadores más importantes del día.
*   **Funcionalidades Clave:**
    *   **Tarjetas de Estadísticas:** Tres tarjetas que muestran: el total de alumnos inscritos, el número de alumnos presentes hoy y el total de eventos (entradas/salidas) del día.
    *   **Registro de Asistencia en Vivo:** Una lista que se actualiza en tiempo real con los últimos 10 registros de entrada o salida.

### 2.2. Gestión de Alumnos

Este módulo es el catálogo digital de todos los estudiantes del plantel.

*   **Propósito:** Centralizar la información de los alumnos y gestionar el estado de su registro biométrico.
*   **Funcionalidades Clave:**
    *   **Tabla de Alumnos:** Muestra una lista completa de los estudiantes con su nombre, matrícula, grupo, comunidad y teléfono del tutor. Incluye filtros para buscar por nombre y grupo.
    *   **Registro de Nuevos Alumnos:** Un formulario emergente permite añadir nuevos estudiantes al sistema, incluyendo su correo de tutor.
    *   **Gestión de Huella Dactilar:** Una columna indica visualmente si la huella de un alumno está "Registrada" o "Pendiente".

### 2.3. Historial de Asistencia

El módulo más robusto para el seguimiento y la auditoría de la asistencia.

*   **Propósito:** Permitir la consulta detallada de los registros de asistencia de cualquier fecha y la exportación de datos consolidados.
*   **Funcionalidades Clave:**
    *   **Calendario Interactivo:** Permite al usuario seleccionar cualquier día para ver los registros correspondientes.
    *   **Visualización por Pestañas:** Agrupa los registros en "Presentes", "Ausentes" y "Manuales".
    *   **Exportación a Excel:** Genera reportes diarios, de ausentes y mensuales.

### 2.4. Consulta de Reportes

Módulo de búsqueda avanzada para análisis históricos e individuales.

*   **Propósito:** Facilitar la localización rápida del historial de asistencia de uno o varios alumnos específicos.
*   **Funcionalidades Clave:**
    *   **Búsqueda Avanzada:** Permite filtrar alumnos por matrícula, nombre, grupo o comunidad.
    *   **Reporte Individual Detallado:** Muestra el historial completo de un alumno, navegable por mes.
    *   **Exportación de Reporte Completo:** Genera un archivo Excel con todo el historial del alumno seleccionado.

### 2.5. Registro Manual

Diseñado para gestionar las excepciones y casos especiales del día a día.

*   **Propósito:** Ofrecer una herramienta flexible para justificar ausencias, registrar permisos o corregir olvidos.
*   **Funcionalidades Clave:**
    *   **Panel de Acceso Rápido:** Muestra listas de alumnos ausentes hoy y los registros manuales ya creados.
    *   **Búsqueda de Alumno:** Permite buscar a cualquier estudiante para añadirle un registro.
    *   **Formulario Flexible:** Permite crear registros de "Entrada/Salida Manual", "Justificar Ausencia" y "Registrar Permiso".

### 2.6. Notificaciones por Correo

Un módulo diseñado para la comunicación automática y fiable con los tutores.

*   **Propósito:** Enviar notificaciones por correo electrónico de forma automática cada vez que un alumno registra una entrada o salida.
*   **Funcionalidades Clave:**
    *   **Envío Asíncrono:** Al crear un registro de asistencia manual, el correo se envía en segundo plano sin afectar la experiencia del usuario.
    *   **Integración con Servicios Profesionales:** Preparado para usar Resend, un servicio de envío de correos robusto.
    *   **Página de Configuración:** Permite a los administradores gestionar las claves de API necesarias para el servicio de envío.

---

## 3. Conclusión

El Sistema de Gestión de Asistencia COBACAM es una solución integral que transforma un proceso manual y tedioso en un flujo de trabajo digital, ágil y centralizado. A través de sus módulos interconectados, la plataforma no solo automatiza la recolección de datos, sino que también proporciona herramientas de alto valor para el análisis, la generación de reportes y la gestión proactiva de la asistencia estudiantil y la comunicación con los tutores.

---

## 4. Anexo: Estructura del Código Fuente

El código fuente completo del proyecto está organizado en la estructura de carpetas y archivos del mismo. La aplicación está desarrollada con Next.js y React, utilizando TypeScript.

*   **Página Principal / Layout:**
    *   `src/app/layout.tsx`
    *   `src/components/layout/sidebar.tsx`
    *   `src/components/layout/header.tsx`

*   **Módulo: Panel de Control**
    *   `src/app/page.tsx`
    *   `src/components/dashboard/stat-card.tsx`
    *   `src/components/dashboard/attendance-feed.tsx`

*   **Módulo: Gestión de Alumnos**
    *   `src/app/students/page.tsx`
    *   `src/app/students/data-table.tsx`
    *   `src/app/students/student-form.tsx`

*   **Módulo: Historial de Asistencia**
    *   `src/app/attendance/page.tsx`

*   **Módulo: Consulta de Reportes**
    *   `src/app/reports/page.tsx`

*   **Módulo: Registro Manual**
    *   `src/app/manual-entry/page.tsx`

*   **Módulo: Configuración**
    *   `src/app/settings/page.tsx`
    *   `src/lib/email.ts`

*   **Tipos y Utilerías**
    *   `src/lib/types.ts`
    *   `src/firebase/`
