ZENKAY: SISTEMA DE GESTIÓN DE ASISTENCIA E IDENTIFICACIÓN BIOMÉTRICA

Zenkay es una solución tecnológica diseñada para la automatización del control de asistencia escolar, integrando hardware biométrico de alta precisión con una plataforma web para la gestión de alumnos, monitoreo en tiempo real y generación de reportes.

ARQUITECTURA DEL SISTEMA
El sistema opera bajo una arquitectura híbrida que garantiza la sincronización constante entre el hardware local y la base de datos en la nube.

1. MÓDULO WEB (DASHBOARD ADMINISTRATIVO)
Desarrollado con Next.js 14+ y TypeScript, incluye las siguientes funcionalidades:

GESTIÓN DE ALUMNOS: Implementación de un CRUD completo para el registro y actualización de datos estudiantiles.

CONTROL DE ASISTENCIA: Visualización en tiempo real de registros, gestión de faltas y justificaciones.

REPORTES: Generación de estadísticas de asistencia a través de componentes interactivos.

SEGURIDAD: Autenticación de usuarios y control de acceso basado en reglas de Firestore.

2. MÓDULO DE HARDWARE (CAPTURA BIOMÉTRICA)
Basado en el sensor biométrico ZFM-20/ZFM-60 (Protocolo Serial):

hardware_manager.py: Script en Python encargado de gestionar la comunicación serial y la sincronización con Firebase.

enroll_gui.py: Interfaz local de consola para el registro de huellas dactilares.

test_sensor.py: Herramienta de diagnóstico para la validación de la conexión física del hardware.

GUÍA DE INSTALACIÓN Y REQUISITOS
REQUISITOS DE HARDWARE Y SOFTWARE
SENSOR: ZFM-20/ZFM-60 Series.

ENTORNO: Python 3.10+ y Node.js 18+.

BASE DE DATOS: Firebase (Firestore + Authentication).

PASOS PARA EL DESPLIEGUE
CLONAR EL REPOSITORIO:

Bash
git clone https://github.com/christomdf-oss/proyecto-112.git
cd proyecto-112/user/studio
CONFIGURACIÓN DEL WEB APP:

Bash
npm install
# Configurar variables en .env.local
npm run dev
CONFIGURACIÓN DE HARDWARE:

Bash
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install pyserial firebase-admin
ACREDITACIÓN:
Colocar el archivo serviceAccountKey.json (proporcionado por Firebase) dentro de la carpeta /docs.

TECNOLOGÍAS PRINCIPALES
FRONTEND: Next.js, React, Tailwind CSS, Shadcn/UI.

BACKEND: Firebase Admin SDK, Firestore.

HARDWARE: PySerial (Python).

INTELIGENCIA: Genkit.

CONSIDERACIONES DE SEGURIDAD
CREDENCIALES: El archivo serviceAccountKey.json está excluido del control de versiones (vía .gitignore) para prevenir la exposición de llaves de acceso.

PRIVACIDAD: La base de datos está protegida mediante reglas de seguridad de Firestore que validan las peticiones en el servidor.
