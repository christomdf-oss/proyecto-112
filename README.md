ZENKAY: SISTEMA DE GESTIÓN DE ASISTENCIA E IDENTIFICACIÓN BIOMÉTRICA
Zenkay es una solución tecnológica diseñada para la automatización del control de asistencia escolar, integrando hardware biométrico de alta precisión con una plataforma web para la gestión de alumnos, monitoreo en tiempo real y generación de reportes.

1. ARQUITECTURA DEL SISTEMA
El sistema opera bajo una arquitectura híbrida que garantiza la sincronización constante entre el hardware local y la base de datos en la nube.

A. MÓDULO WEB (DASHBOARD ADMINISTRATIVO)
Desarrollado con Next.js 14+ y TypeScript, incluye las siguientes funcionalidades:

Gestión de alumnos: implementación de un CRUD completo para el registro y actualización de datos estudiantiles.

Control de asistencia: visualización en tiempo real de registros, gestión de faltas y justificaciones.

Reportes: generación de estadísticas de asistencia a través de componentes interactivos.

Seguridad: autenticación de usuarios y control de acceso basado en reglas de Firestore.

B. MÓDULO DE HARDWARE (CAPTURA BIOMÉTRICA)
Basado en el sensor biométrico ZFM-20/ZFM-60 (protocolo serial):

hardware_manager.py: script en Python encargado de gestionar la comunicación serial y la sincronización con Firebase.

enroll_gui.py: interfaz local de consola para el registro de huellas dactilares.

test_sensor.py: herramienta de diagnóstico para la validación de la conexión física del hardware.

2. GUÍA DE INSTALACIÓN Y REQUISITOS
REQUISITOS DE HARDWARE Y SOFTWARE
Sensor: ZFM-20/ZFM-60 series.

Entorno: Python 3.10+ y Node.js 18+.

Base de datos: Firebase (Firestore + Authentication).

PASOS PARA EL DESPLIEGUE
CLONAR EL REPOSITORIO: git clone https://github.com/christomdf-oss/proyecto-112.git cd proyecto-112/user/studio

CONFIGURACIÓN DEL WEB APP: npm install (y configurar variables en .env.local) npm run dev

CONFIGURACIÓN DE HARDWARE: python -m venv venv, source venv/bin/activate, pip install pyserial firebase-admin

Acreditación: colocar el archivo serviceAccountKey.json (proporcionado por Firebase) dentro de la carpeta /docs.

3. TECNOLOGÍAS PRINCIPALES
Frontend: Next.js, React, Tailwind CSS, Shadcn/UI.

Backend: Firebase Admin SDK, Firestore.

Hardware: PySerial (Python).

Inteligencia: Genkit.

4. CONSIDERACIONES DE SEGURIDAD
Credenciales: el archivo serviceAccountKey.json está excluido del control de versiones (vía .gitignore) para prevenir la exposición de llaves de acceso.

Privacidad: la base de datos está protegida mediante reglas de seguridad de Firestore que validan las peticiones en el servidor.
