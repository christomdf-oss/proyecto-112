Zenkay es una solución tecnológica integral diseñada para automatizar el control de asistencia en entornos educativos. El sistema integra hardware biométrico de alta precisión con una plataforma web centralizada para gestionar el registro de alumnos, el monitoreo en tiempo real y la generación de reportes académicos.

🏗 Arquitectura del Sistema
El sistema opera mediante una arquitectura híbrida que garantiza la sincronización constante entre el hardware de captura y la base de datos en la nube.

1. Módulo Web (Dashboard Administrativo)
Desarrollado con Next.js 14+ y TypeScript, permite a los docentes y directivos:

Gestión de Alumnos: CRUD completo para el registro y actualización de datos estudiantiles.

Control de Asistencia: Visualización en tiempo real de registros, gestión de faltas y justificaciones.

Reportes: Generación de estadísticas de asistencia mediante componentes interactivos.

Seguridad: Autenticación robusta y control de acceso mediante reglas de Firestore.

2. Módulo de Hardware (Captura Biométrica)
El núcleo de la identificación está basado en el Sensor Biométrico ZFM-20/ZFM-60 (o compatible con protocolo serial):

hardware_manager.py: Script en Python que gestiona la comunicación serial entre el sensor y el sistema.

enroll_gui.py: Interfaz local diseñada para el alta rápida de huellas dactilares, permitiendo registrar usuarios sin necesidad de acceso a la web.

test_sensor.py: Herramienta de diagnóstico para la detección y validación de la conexión USB/Serial.

🛠 Guía de Instalación y Requisitos
Requisitos de Hardware y Software
Sensor: Sensor de huella dactilar compatible con protocolo serial (ej. ZFM series).

Entorno: Python 3.10+ y Node.js 18+.

Base de Datos: Proyecto en Firebase (Firestore + Authentication).

Pasos para el Despliegue
Clonar el repositorio:

Bash
git clone https://github.com/christomdf-oss/proyecto-112.git
cd proyecto-112/user/studio
Configuración del Web App:

Bash
npm install
# Configurar variables en .env.local
npm run dev
Configuración de Hardware:

Bash
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install pyserial firebase-admin
Credenciales:
Colocar el archivo serviceAccountKey.json (obtenido de la consola de Firebase) dentro de la carpeta /docs.

🚀 Tecnologías Principales
Frontend: Next.js, React, Tailwind CSS, Shadcn/UI.

Backend: Firebase Admin SDK, Firestore.

Hardware: PySerial para comunicación con sensores biométricos.

Análisis: Genkit (Framework de IA para optimización de datos).

🛡 Consideraciones de Seguridad
Credenciales: El archivo serviceAccountKey.json está excluido del control de versiones (.gitignore) para prevenir accesos no autorizados.

Privacidad: La base de datos está protegida con reglas de Firestore que validan las peticiones en el servidor.
