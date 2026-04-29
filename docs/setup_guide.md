# Guía de Configuración del Backend de COBACAM

Esta guía proporciona los pasos técnicos para configurar los componentes de backend necesarios para que el sistema de asistencia de COBACAM funcione con una base de datos en vivo y hardware real.

---

## Índice
1.  [Arquitectura General](#1-arquitectura-general)
2.  [Configuración de Firebase Firestore](#2-configuración-de-firebase-firestore)
    *   [2.1. Creación del Proyecto](#21-creación-del-proyecto)
    *   [2.2. Estructura de la Base de Datos](#22-estructura-de-la-base-de-datos)
    *   [2.3. Reglas de Seguridad](#23-reglas-de-seguridad)
3.  [Configuración del Backend en tu PC (o Raspberry Pi)](#3-configuración-del-backend-en-tu-pc-o-raspberry-pi)
    *   [3.1. Obtener Credenciales de Firebase para los Scripts](#31-obtener-credenciales-de-firebase-para-los-scripts)
    *   [3.2. Script de Python para Registrar Huellas (`enroll.py`)](#32-script-de-python-para-registrar-huellas-enrollpy)
    *   [3.3. Script de Python para Captura de Asistencia (`attendance.py`)](#33-script-de-python-para-captura-de-asistencia-attendancepy)
    *   [3.4. Recomendaciones de Lector de Huellas](#34-recomendaciones-de-lector-de-huellas)
4.  [Sistema de Notificaciones por Correo Electrónico](#4-sistema-de-notificaciones-por-correo-electrónico)

---

## 1. Arquitectura General

El sistema se compone de tres partes principales:

*   **Aplicación Web (Frontend):** La interfaz de Next.js que estás viendo. Sirve como un panel de control para visualizar y gestionar los datos. **Esta aplicación se accede desde cualquier navegador, en cualquier sistema operativo (Windows, Mac, etc.).**
*   **Base de Datos (Firestore):** El cerebro del sistema. Almacena toda la información de alumnos y sus registros de asistencia.
*   **Script de Captura (Backend):** Scripts de Python que se ejecutan en una **computadora con el sensor de huellas conectado** (puede ser tu PC de escritorio con Windows o una Raspberry Pi). Estos se conectan al lector de huellas y a Firestore para registrar las asistencias y enrolar nuevas huellas.

## 2. Configuración de Firebase Firestore

### 2.1. Creación del Proyecto

Si aún no lo has hecho, crea un nuevo proyecto en la [Consola de Firebase](https://console.firebase.google.com/). Una vez creado, selecciona la opción para añadir **Firestore Database**.

### 2.2. Estructura de la Base de Datos

Tu base de datos en Firestore tendrá dos colecciones principales:

*   `students`: Cada documento en esta colección representa a un estudiante. El ID del documento debe ser la **matrícula** del alumno.
    *   **Ejemplo de documento en `students`:**
        ```json
        {
            "nombre": "Juan Pérez",
            "grupo": "301",
            "comunidad": "CHICBUL",
            "telefono_tutor": "5219811234567",
            "correo_tutor": "tutor.juan@example.com",
            "fingerprintTemplate": "base64_encoded_string_here" 
        }
        ```
*   `asistencias`: Cada documento es un registro de entrada o salida.
    *   **Ejemplo de documento en `asistencias`:**
        ```json
        {
            "studentId": "243011001",
            "studentName": "Juan Pérez",
            "timestamp": December 10, 2023 at 7:30:00 AM UTC-6,
            "type": "entrada"
        }
        ```

### 2.3. Reglas de Seguridad

Estas reglas permiten que la aplicación web lea los datos, pero solo el script de Python (que usa credenciales de administrador) podrá escribir en la base de datos. Ve a tu proyecto de Firebase -> Firestore Database -> Pestaña de Reglas y pega lo siguiente:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

## 3. Configuración del Backend en tu PC (o Raspberry Pi)

**Aclaración Importante:** El hardware (lector de huellas) se conecta a una computadora que ejecuta los scripts de Python. Puede ser una **Raspberry Pi** con Linux o tu **PC de escritorio** con Windows. La compatibilidad del lector es crucial.

### 3.1. Obtener Credenciales de Firebase para los Scripts

Tus scripts de Python necesitan un archivo de credenciales para autenticarse de forma segura.

1.  En la consola de Firebase, ve a **Configuración del proyecto** (el ícono del engranaje).
2.  Ve a la pestaña **Cuentas de servicio**.
3.  Haz clic en **"Generar nueva clave privada"**. Se descargará un archivo `.json`.
4.  **Renombra** este archivo a `serviceAccountKey.json` y cópialo a tu PC en la misma carpeta donde estarán tus scripts. **¡NUNCA compartas este archivo ni lo subas a un repositorio público!**

### 3.2. Script de Python para Registrar Huellas (`enroll.py`)

Este script se ejecuta solo cuando necesitas registrar la huella de un nuevo alumno. Está configurado para usar un sensor **ZKTeco ZK9500** con la librería `pyzkfp`.

**Instala las librerías necesarias en tu PC:**
```bash
# Instalar Python si no lo tienes: https://www.python.org/downloads/
pip install firebase-admin
pip install pyzkfp
```
> **Nota para Windows:** La instalación de `pyzkfp` puede requerir "Microsoft C++ Build Tools". Si la instalación falla, puedes descargarlas desde [aquí](https://visualstudio.microsoft.com/visual-cpp-build-tools/).

**Código del script (`enroll.py`):**
```python
import time
import firebase_admin
from firebase_admin import credentials, firestore
import base64
from pyzkfp import ZKFP

def initialize_sensor():
    """Inicializa el sensor de huellas."""
    try:
        zkfp = ZKFP()
        print("Sensor ZK9500 inicializado correctamente.")
        return zkfp
    except Exception as e:
        print(f"Error al inicializar el sensor: {e}")
        print("Asegúrate de que el sensor esté conectado y los drivers instalados.")
        return None

def enroll_fingerprint(zkfp):
    """
    Captura y crea una plantilla de huella.
    Requiere 3 capturas exitosas.
    """
    print("\n--- Iniciando Proceso de Registro de Huella ---")
    templates = []
    for i in range(1, 4):
        input(f"Presiona Enter y luego coloca el dedo en el sensor para la captura #{i}...")
        
        template = zkfp.capture()
        if not template:
            print("Error en la captura. Intenta de nuevo.")
            return None
        
        templates.append(template)
        print(f"Captura #{i} exitosa.")
        time.sleep(1) # Pequeña pausa
    
    # Unir las plantillas
    try:
        enrolled_template = zkfp.enroll(templates)
        print("¡Plantilla de huella creada exitosamente!")
        return enrolled_template
    except Exception as e:
        print(f"Error al crear la plantilla final: {e}")
        return None


# --- Inicialización de Firebase ---
try:
    cred = credentials.Certificate("serviceAccountKey.json")
    if not firebase_admin._apps:
        firebase_admin.initialize_app(cred)
    db = firestore.client()
    print("Conexión con Firebase establecida.")
except Exception as e:
    print(f"Error al conectar con Firebase: {e}")
    exit()

# --- Lógica Principal de Enrolamiento ---
zkfp = initialize_sensor()
if not zkfp:
    exit()

while True:
    matricula = input("\nIngresa la matrícula del alumno a registrar (o 'exit' para salir): ")
    if matricula.lower() == 'exit':
        break

    # 1. Verificar si el alumno existe
    student_ref = db.collection('students').document(matricula)
    student_doc = student_ref.get()

    if not student_doc.exists:
        print(f"Error: No se encontró ningún alumno con la matrícula '{matricula}'.")
        continue
    
    student_data = student_doc.to_dict()
    print(f"Alumno encontrado: {student_data.get('nombre')}")

    if student_data.get('fingerprintTemplate') is not None:
        print(f"ADVERTENCIA: Este alumno ya tiene una huella registrada.")
        overwrite = input("¿Deseas sobreescribirla? (s/n): ").lower()
        if overwrite != 's':
            print("Registro cancelado.")
            continue
    
    try:
        # 2. Registrar huella
        template = enroll_fingerprint(zkfp)

        if template:
            # 3. Codificar en Base64 y actualizar Firestore
            encoded_template = base64.b64encode(template).decode('utf-8')
            student_ref.update({
                'fingerprintTemplate': encoded_template
            })
            print(f"¡Éxito! La base de datos ha sido actualizada para {student_data.get('nombre')}.")

    except Exception as e:
        print(f"Ocurrió un error durante el registro: {e}")

# Finalizar la conexión con el sensor
del zkfp
print("\nConexión con el sensor finalizada.")
```

### 3.3. Script de Python para Captura de Asistencia (`attendance.py`)

Este script se ejecuta para el día a día. Se queda esperando una huella, la identifica y registra la entrada o salida.

**Código del script (`attendance.py`):**

```python
import time
import datetime
import firebase_admin
from firebase_admin import credentials, firestore
import base64
from pyzkfp import ZKFP

# --- Inicialización ---
try:
    # Firebase
    cred = credentials.Certificate("serviceAccountKey.json")
    if not firebase_admin._apps:
        firebase_admin.initialize_app(cred)
    db = firestore.client()
    print("Conexión con Firebase establecida.")
    # Sensor
    zkfp = ZKFP()
    print("Sensor ZK9500 inicializado correctamente.")
except Exception as e:
    print(f"Error en la inicialización: {e}")
    exit()

def load_templates_from_firestore():
    """
    Carga todas las plantillas de huellas desde Firestore a la memoria.
    """
    print("\nCargando plantillas de huellas desde la base de datos...")
    templates_map = {}
    try:
        students_ref = db.collection('students').where('fingerprintTemplate', '!=', None).stream()
        for student in students_ref:
            student_data = student.to_dict()
            # Guardamos la plantilla decodificada, asociada a la matrícula (ID del documento)
            templates_map[student.id] = base64.b64decode(student_data['fingerprintTemplate'])
        
        print(f"Se cargaron {len(templates_map)} plantillas de huellas.")
        return templates_map
    except Exception as e:
        print(f"Error al cargar plantillas: {e}")
        return {}

def get_student_by_id(student_id):
    """Busca un alumno en Firestore usando su matrícula (ID del documento)."""
    student_ref = db.collection('students').document(student_id)
    student_doc = student_ref.get()
    if student_doc.exists:
        return student_doc.to_dict(), student_doc.id
    return None, None

def get_last_attendance(student_id):
    """Obtiene el último registro de asistencia de un alumno para el día de hoy."""
    today = datetime.datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    tomorrow = today + datetime.timedelta(days=1)

    attendance_ref = db.collection('asistencias')
    query = attendance_ref.where('studentId', '==', student_id) \
                           .where('timestamp', '>=', today) \
                           .where('timestamp', '<', tomorrow) \
                           .order_by('timestamp', direction=firestore.Query.DESCENDING) \
                           .limit(1) \
                           .stream()

    for record in query:
        return record.to_dict()
    return None

def register_attendance(student_data, student_id, record_type):
    """Registra un nuevo evento de entrada o salida en Firestore."""
    current_time = datetime.datetime.now()
    
    new_record = {
        'studentId': student_id,
        'studentName': student_data['nombre'],
        'timestamp': current_time,
        'type': record_type
    }
    db.collection('asistencias').add(new_record)
    print(f"ÉXITO: Registro de '{record_type}' para {student_data['nombre']}.")
    print("INFO: La notificación por correo se procesará en el backend web si está configurada.")

# --- Bucle Principal de Escucha ---
all_templates = load_templates_from_firestore()

while True:
    print("\nEsperando huella...")
    live_template = zkfp.capture()

    if not live_template:
        print("Error en captura, reintentando...")
        time.sleep(2)
        continue

    # Comparar la huella capturada con todas las plantillas en memoria
    match_found = False
    for student_id, stored_template in all_templates.items():
        if zkfp.match_template(live_template, stored_template):
            print(f"Huella reconocida. Coincide con la matrícula: {student_id}")
            match_found = True
            
            student_data, doc_id = get_student_by_id(student_id)
            if not student_data:
                print(f"ERROR: No se encontraron datos para la matrícula {student_id}.")
                break
            
            print(f"Alumno identificado: {student_data['nombre']}")

            last_record = get_last_attendance(student_id)
            
            if last_record and last_record['type'] == 'entrada':
                register_attendance(student_data, student_id, 'salida')
            else:
                register_attendance(student_data, student_id, 'entrada')
            
            break # Salir del bucle de comparación

    if not match_found:
        print("ERROR: Huella no reconocida. No coincide con ninguna plantilla en la base de datos.")
    
    print("-" * 20)
    time.sleep(1)
```

### 3.4. Recomendaciones de Lector de Huellas

Para que un lector de huellas funcione con este sistema, **NO importa la marca, el precio o la tienda donde lo compres**. Lo único que importa es que cumpla con **DOS** requisitos técnicos para que pueda ser controlado desde el script de Python en tu PC o Raspberry Pi:

1.  **Compatibilidad con el Sistema Operativo (Windows/Linux):**
    *   Para lectores **USB genéricos**, el modelo debe ser compatible con la librería de Python que se usará. Por ejemplo, los scripts de esta guía están adaptados para el **ZKTeco ZK9500** y la librería `pyzkfp`.

2.  **Compatibilidad con el Lenguaje de Programación (Python):**
    *   Debe existir una **librería de Python** que permita controlar el lector.
        *   Para los sensores ZK9500, la librería es `pyzkfp`.
        *   Para los sensores tipo módulo (GT-521Fxx), la librería es `pyfingerprint`.

**En resumen: si encuentras un lector, tu checklist de dos pasos es:**
1.  ¿Funciona en mi sistema operativo (Windows/Linux)?
2.  ¿Existe una librería de Python para controlarlo y tiene buena documentación?

Si la respuesta a ambas preguntas es sí, ¡el lector es compatible!

---

## 4. Sistema de Notificaciones por Correo Electrónico

El sistema está preparado para enviar notificaciones automáticas por correo electrónico a los tutores.

*   **¿Cómo funciona?**
    1.  **Registro de Correo:** Asegúrate de que cada alumno tenga el `correo_tutor` registrado en su perfil.
    2.  **Envío Automático:** Cuando se registra una **entrada** o **salida** desde la aplicación web (por ejemplo, un registro manual), el sistema envía automáticamente un correo al tutor.
    3.  **Configuración del Servicio de Envío:** El sistema utiliza **Resend** para el envío. Para que funcione, debes configurar tu clave de API de Resend como una variable de entorno en tu servidor.
    4.  **Automatización Completa (Opcional):** Para que los registros del lector de huellas también envíen correos, el paso final es implementar una **Cloud Function** en Firebase que se active cada vez que se cree un nuevo documento en la colección `asistencias` y ejecute la lógica de envío de correo.

    
