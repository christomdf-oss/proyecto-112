# COBACAM - Sistema de Gestión de Asistencia

Bienvenido al sistema de gestión de asistencia para el plantel **COBACAM 10 Chicbul**. Esta aplicación web ha sido desarrollada para ofrecer una solución completa y robusta que facilita el seguimiento de la asistencia de los alumnos, la comunicación con los padres de familia y la generación de reportes detallados.

A continuación, se presenta un resumen de todas las funcionalidades implementadas en el sistema.

---

## Módulos Principales

### 1. Panel de Control (`/`)

Es la página principal y ofrece una vista general del estado diario del plantel.
- **Tarjetas de Estadísticas:** Muestra indicadores clave como el número total de alumnos registrados, los alumnos presentes hoy, el total de eventos de entrada/salida del día y las notificaciones enviadas en las últimas 24 horas.
- **Registro en Vivo:** Un feed que muestra los últimos 10 eventos de asistencia (entradas y salidas) en tiempo real.
- **Últimas Notificaciones:** Un panel que registra el estado de las notificaciones de WhatsApp enviadas a los tutores, indicando si fueron exitosas o fallidas.

### 2. Gestión de Alumnos (`/students`)

Este módulo permite administrar el catálogo completo de estudiantes.
- **Registro de Alumnos:** Un formulario para añadir nuevos alumnos, solicitando datos como nombre completo, matrícula, teléfono del tutor, grupo y comunidad de origen.
- **Tabla de Alumnos:** Una vista completa de todos los estudiantes con filtros por nombre y grupo.
- **Estado de Huella Dactilar:** Una columna visual indica si la huella de un alumno está "Registrada" o "Pendiente".
- **Registro de Huella Interactivo:** Para los alumnos con huella "Pendiente", se puede iniciar un proceso de registro a través de una ventana emergente que simula la captura y confirma el registro exitoso en tiempo real, actualizando el estado en la tabla sin necesidad de recargar.

### 3. Historial de Asistencia (`/attendance`)

El corazón del sistema para el seguimiento diario.
- **Calendario Interactivo:** Permite seleccionar cualquier fecha para consultar los registros de asistencia correspondientes.
- **Pestañas de Visualización:**
    - **Presentes:** Lista los alumnos que registraron su entrada en la fecha seleccionada, mostrando la hora de entrada y salida.
    - **Ausentes:** Muestra todos los alumnos que no tienen registro de entrada para ese día, incluyendo el teléfono del tutor para un contacto rápido.
    - **Manuales:** Centraliza todos los registros añadidos manualmente (entradas, salidas, justificaciones y permisos) para la fecha seleccionada.
- **Exportación a Excel:**
    - **Exportar Día:** Genera un reporte en Excel de la asistencia del día, separado por hojas para cada grupo.
    - **Exportar Mes:** Crea un reporte mensual "inteligente" con una hoja de resumen general (asistencias, ausencias, puntualidad, promedios por grupo) y hojas de detalle por cada grupo.

### 4. Consulta de Reportes (`/reports`)

Un potente módulo para búsquedas específicas y análisis históricos.
- **Búsqueda Avanzada:** Permite encontrar a uno o varios alumnos utilizando filtros por matrícula, nombre, grupo y/o comunidad.
- **Reporte Individual:** Al seleccionar un alumno, se muestra una vista detallada de su historial de asistencia, con la posibilidad de navegar entre meses.
- **Exportación de Reporte Completo:** Genera un archivo de Excel para el alumno seleccionado que contiene su historial completo. El archivo incluye una hoja de cálculo separada para cada mes, y cada hoja contiene un resumen estadístico y la lista detallada de sus registros.

### 5. Registro Manual (`/manual-entry`)

Módulo diseñado para manejar todas las excepciones y situaciones especiales del día a día.
- **Panel de Control Diario:**
    - **Alumnos Ausentes Hoy:** Muestra una lista de los alumnos que no han llegado, con un botón para añadirles un registro directamente.
    - **Registros Manuales de Hoy:** Un historial de todas las justificaciones y permisos registrados durante el día.
- **Formulario de Registro Flexible:** Permite buscar a cualquier alumno y añadirle uno de los siguientes tipos de registro:
    - **Entrada/Salida Manual:** Para corregir olvidos o errores en el lector de huellas.
    - **Justificar Ausencia:** Para documentar una falta de día completo (no afecta el conteo de asistencia).
    - **Registrar Permiso:** Para salidas temporales que no deben contar como una salida oficial (ej. ir a la papelería).
- **Registro de Motivo:** Todos los registros manuales requieren una justificación, asegurando que cada excepción quede documentada.
