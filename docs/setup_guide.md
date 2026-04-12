# Guía de Configuración del Backend de COBACAM

Esta guía proporciona los pasos técnicos para configurar los componentes de backend necesarios para que el sistema de asistencia de COBACAM funcione con una base de datos en vivo y hardware real.

---

## Índice
1.  [Arquitectura General](#1-arquitectura-general)
2.  [Configuración de Firebase Firestore](#2-configuración-de-firebase-firestore)
    *   [2.1. Creación del Proyecto](#21-creación-del-proyecto)
    *   [2.2. Estructura de la Base de Datos](#22-estructura-de-la-base-de-datos)
    *   [2.3. Reglas de Seguridad](#23-reglas-de-seguridad)
3.  [Configuración del Backend en Raspberry Pi](#3-configuración-del-backend-en-raspberry-pi)
    *   [3.1. Obtener Credenciales de Firebase](#31-obtener-credenciales-de-firebase)
    *   [3.2. Script de Python para Captura de Asistencia](#32-script-de-python-para-captura-de-asistencia)
4.  [Sistema de Notificaciones por WhatsApp](#4-sistema-de-notificaciones-por-whatsapp)

---

## 1. Arquitectura General

El sistema se compone de tres partes principales:

*   **Aplicación Web (Frontend):** La interfaz de Next.js que estás viendo. Sirve como un panel de control para visualizar y gestionar los datos.
*   **Base de Datos (Firestore):** El cerebro del sistema. Almacena toda la información de alumnos y sus registros de asistencia.
*   **Script de Captura (Backend):** Un script de Python que se ejecuta en una Raspberry Pi. Este se conecta al lector de huellas y a Firestore para registrar las asistencias en tiempo real y encolar las notificaciones de WhatsApp.

## 2. Configuración de Firebase Firestore

### 2.1. Creación del Proyecto

Si aún no lo has hecho, crea un nuevo proyecto en la [Consola de Firebase](https://console.firebase.google.com/). Una vez creado, selecciona la opción para añadir **Firestore Database**.

### 2.2. Estructura de la Base de Datos

Tu base de datos en Firestore tendrá tres colecciones principales:

*   `students`: Cada documento en esta colección representa a un estudiante. El ID del documento debe ser la **matrícula** del alumno.
    *   **Ejemplo de documento en `students`:**
        ```json
        {
            "nombre": "Juan Pérez",
            "grupo": "301",
            "comunidad": "CHICBUL",
            "telefono_tutor": "5219811234567", // Formato E.164 recomendado
            "fingerprintId": 123 // ID numérico que devuelve tu lector de huellas
        }
        ```
*   `asistencias`: Cada documento es un registro de entrada o salida.
    *   **Ejemplo de documento en `asistencias`:**
        ```json
        {
            "studentId": "243011001", // Matrícula del alumno
            "studentName": "Juan Pérez",
            "timestamp": December 10, 2023 at 7:30:00 AM UTC-6, // Tipo de dato Timestamp
            "type": "entrada" // o "salida"
        }
        ```
*   `whatsapp_queue`: Cada documento es una notificación pendiente para ser enviada manualmente.
    *   **Ejemplo de documento en `whatsapp_queue`:**
        ```json
        {
            "studentId": "243011001",
            "studentName": "Juan Pérez",
            "tutorPhone": "5219811234567",
            "eventType": "entrada",
            "timestamp": December 10, 2023 at 7:30:00 AM UTC-6,
            "status": "pendiente" // o "enviado"
        }
        ```

### 2.3. Reglas de Seguridad

Estas reglas permiten que la aplicación web lea los datos, pero solo el script de la Raspberry Pi (que usa credenciales de administrador) podrá escribir en la base de datos. Ve a tu proyecto de Firebase -> Firestore Database -> Pestaña de Reglas y pega lo siguiente:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // El SDK de Python `firebase-admin` utiliza una cuenta de servicio que tiene
    // privilegios de administrador y omite las reglas de seguridad por defecto.
    
    // En un entorno de producción real, se recomienda restringir el acceso
    // a solo usuarios autenticados. Ej. `allow read, write: if request.auth != null;`
    
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

## 3. Configuración del Backend en Raspberry Pi

### 3.1. Obtener Credenciales de Firebase

Tu script de Python necesita un archivo de credenciales para autenticarse de forma segura.

1.  En la consola de Firebase, ve a **Configuración del proyecto** (el ícono del engranaje).
2.  Ve a la pestaña **Cuentas de servicio**.
3.  Haz clic en **"Generar nueva clave privada"**. Se descargará un archivo `.json`.
4.  **Renombra** este archivo a `serviceAccountKey.json` y cópialo a tu Raspberry Pi en la misma carpeta donde estará tu script. **¡NUNCA compartas este archivo ni lo subas a un repositorio público!**

### 3.2. Script de Python para Captura de Asistencia

Este es un script de ejemplo completo. Deberás adaptarlo para que funcione con la librería específica de tu lector de huellas.

**Instala las librerías necesarias en tu Raspberry Pi:**
```bash
pip install firebase-admin
# También instala la librería para tu lector de huellas, por ejemplo:
# pip install adafruit-circuitpython-fingerprint
```

**Código del script (`main.py`):**

```python
import time
import datetime
import firebase_admin
from firebase_admin import credentials, firestore

# --- ¡DEBES CONFIGURAR ESTO! ---
# Reemplaza esta función con la lógica real de tu sensor de huellas.
# Debe devolver el ID numérico de la huella detectada.
def get_fingerprint_id():
    """
    Función de ejemplo para simular la lectura de una huella.
    Debe ser reemplazada por el código de tu sensor.
    """
    print("Esperando huella...")
    # Aquí iría el código que lee el sensor.
    # time.sleep(2) # Simula espera
    try:
        # Pide al usuario que ingrese un ID para la simulación
        finger_id = int(input("Ingresa ID de huella (ej. 1, 2, 3...): "))
        print(f"Huella leída con ID: {finger_id}")
        return finger_id
    except ValueError:
        print("ID no válido. Inténtalo de nuevo.")
        return None

# --- INICIALIZACIÓN DE FIREBASE ---
# Asegúrate de que el archivo 'serviceAccountKey.json' esté en la misma carpeta.
cred = credentials.Certificate("serviceAccountKey.json")

# Reemplaza '<TU-ID-DE-PROYECTO>' con el ID de tu proyecto de Firebase.
firebase_admin.initialize_app(cred, {
    'projectId': '<TU-ID-DE-PROYECTO>',
})

db = firestore.client()
print("Conexión con Firebase establecida.")

# --- LÓGICA PRINCIPAL ---
def get_student_by_fingerprint(finger_id):
    """Busca un alumno en Firestore usando el ID de su huella."""
    students_ref = db.collection('students')
    # Hacemos una consulta para encontrar el doc. donde el campo 'fingerprintId' coincida.
    query = students_ref.where('fingerprintId', '==', finger_id).limit(1).stream()
    
    for student in query:
        return student.to_dict(), student.id # Devuelve los datos y la matrícula (ID del doc)
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

    # Añadir a la cola de notificaciones de WhatsApp
    if record_type in ['entrada', 'salida']:
        whatsapp_record = {
            'studentId': student_id,
            'studentName': student_data['nombre'],
            'tutorPhone': student_data['telefono_tutor'],
            'eventType': record_type,
            'timestamp': current_time,
            'status': 'pendiente'
        }
        db.collection('whatsapp_queue').add(whatsapp_record)
        print(f"INFO: Se añadió un mensaje a la cola de WhatsApp para {student_data['nombre']}.")


# Bucle principal del programa
while True:
    finger_id = get_fingerprint_id()

    if finger_id is None:
        continue

    student_data, student_id = get_student_by_fingerprint(finger_id)

    if not student_data:
        print(f"ERROR: Huella con ID {finger_id} no está registrada en la base de datos.")
        continue

    print(f"Alumno identificado: {student_data['nombre']} ({student_id})")

    last_record = get_last_attendance(student_id)
    
    # Decidir si es entrada o salida
    if last_record and last_record['type'] == 'entrada':
        # Si el último registro fue una entrada, el siguiente es una salida
        register_attendance(student_data, student_id, 'salida')
    else:
        # Si no hay registros hoy o el último fue una salida, el siguiente es una entrada
        register_attendance(student_data, student_id, 'entrada')
    
    print("-" * 20)

```

## 4. Sistema de Notificaciones por WhatsApp

El sistema utiliza un enfoque **semi-manual** para el envío de notificaciones de WhatsApp, lo que elimina los costos asociados a APIs de terceros y reduce el riesgo de bloqueos.

*   **¿Cómo funciona?**
    1.  Cuando un alumno registra una entrada o salida (a través del lector de huellas o manualmente), el sistema automáticamente crea un registro en la colección `whatsapp_queue` de la base de datos con el estado "pendiente".
    2.  El personal administrativo accede a la nueva página **"WhatsApp Pendientes"** en la aplicación web.
    3.  Esta página muestra una lista de todos los mensajes pendientes de enviar.
    4.  Al presionar el botón **"Enviar WhatsApp"** en un registro, se abre una ventana nueva de `wa.me` con el número del tutor y el mensaje ya pre-escrito.
    5.  El administrador solo necesita hacer clic en "Enviar" en la página de WhatsApp.
    6.  El sistema marca automáticamente el registro como "enviado" y lo elimina de la lista de pendientes.

Este método combina la automatización de la creación de mensajes con el control manual del envío, proporcionando una solución eficiente y sin costo.
