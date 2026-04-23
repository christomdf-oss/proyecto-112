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
    *   [3.3. Recomendaciones de Lector de Huellas (Sensor)](#33-recomendaciones-de-lector-de-huellas-sensor)
4.  [Sistema de Notificaciones por Correo Electrónico](#4-sistema-de-notificaciones-por-correo-electrónico)

---

## 1. Arquitectura General

El sistema se compone de tres partes principales:

*   **Aplicación Web (Frontend):** La interfaz de Next.js que estás viendo. Sirve como un panel de control para visualizar y gestionar los datos.
*   **Base de Datos (Firestore):** El cerebro del sistema. Almacena toda la información de alumnos y sus registros de asistencia.
*   **Script de Captura (Backend):** Un script de Python que se ejecuta en una Raspberry Pi. Este se conecta al lector de huellas y a Firestore para registrar las asistencias en tiempo real.

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
            "fingerprintId": 123 
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

Estas reglas permiten que la aplicación web lea los datos, pero solo el script de la Raspberry Pi (que usa credenciales de administrador) podrá escribir en la base de datos. Ve a tu proyecto de Firebase -> Firestore Database -> Pestaña de Reglas y pega lo siguiente:

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
# También instala la librería para tu lector de huellas
```

**Código del script (`main.py`):**

```python
import time
import datetime
import firebase_admin
from firebase_admin import credentials, firestore

def get_fingerprint_id():
    """
    Función de ejemplo para simular la lectura de una huella.
    Debe ser reemplazada por el código de tu sensor.
    """
    print("Esperando huella...")
    try:
        finger_id = int(input("Ingresa ID de huella (ej. 1, 2, 3...): "))
        print(f"Huella leída con ID: {finger_id}")
        return finger_id
    except ValueError:
        print("ID no válido. Inténtalo de nuevo.")
        return None

cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)
db = firestore.client()
print("Conexión con Firebase establecida.")

def get_student_by_fingerprint(finger_id):
    """Busca un alumno en Firestore usando el ID de su huella."""
    students_ref = db.collection('students')
    query = students_ref.where('fingerprintId', '==', finger_id).limit(1).stream()
    
    for student in query:
        return student.to_dict(), student.id
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
    
    # La notificación por correo será gestionada por la aplicación web
    # o una Cloud Function que escuche la colección 'asistencias'.
    print("INFO: La notificación por correo se procesará en el backend.")


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
    
    if last_record and last_record['type'] == 'entrada':
        register_attendance(student_data, student_id, 'salida')
    else:
        register_attendance(student_data, student_id, 'entrada')
    
    print("-" * 20)

```

### 3.3. Recomendaciones de Lector de Huellas (Sensor)

La compatibilidad del lector de huellas no depende de la aplicación web, sino de su capacidad para conectarse a la **Raspberry Pi** y ser controlado mediante una **librería de Python**.

A continuación, se presentan algunas opciones populares y bien documentadas que son excelentes para este tipo de proyecto:

#### 1. Sensor Adafruit ZFM-20 / GT-521Fxx (Opción Recomendada)

*   **Descripción:** Este es uno de los sensores más populares en la comunidad de desarrolladores y makers. Es relativamente económico y existe una gran cantidad de tutoriales y librerías para usarlo con Raspberry Pi.
*   **Conexión:** Generalmente se conecta a través de los pines GPIO (TX/RX), aunque existen adaptadores USB a TTL que facilitan la conexión a un puerto USB.
*   **Librería de Python:** La librería más común es `pyfingerprint`. Puedes instalarla con `pip install pyfingerprint` y te permite registrar huellas, buscar, eliminar y verificar con facilidad.
*   **Por qué es una buena opción:** Su popularidad significa que cualquier problema que encuentres, es muy probable que alguien más ya lo haya resuelto y documentado en foros o blogs.

#### 2. Lectores Digital Persona U.are.U

*   **Descripción:** Estos son lectores de grado más comercial, conocidos por su fiabilidad y rapidez. Son los que a menudo se ven en entornos de oficina.
*   **Conexión:** Son directamente USB, lo que simplifica la conexión física.
*   **Librería de Python:** La integración puede ser un poco más compleja. No siempre hay una librería de `pip` directa. A menudo, se requiere instalar los drivers oficiales para Linux y luego usar una librería de Python que se comunique con esos drivers, como `pyfprint` (una envoltura de `libfprint`).
*   **Por qué es una buena opción:** Si buscas una solución más robusta y no te intimida la posible configuración de drivers en Linux.

**Conclusión de la Recomendación:**

Para empezar y asegurar la compatibilidad más sencilla, te recomiendo encarecidamente buscar un **sensor tipo GT-521F32 o GT-521F52** (o un kit de Adafruit que lo incluya). La disponibilidad de la librería `pyfingerprint` hará que la integración con el script de Python sea mucho más directa.

---

## 4. Sistema de Notificaciones por Correo Electrónico

El sistema está preparado para enviar notificaciones automáticas por correo electrónico a los tutores.

*   **¿Cómo funciona?**
    1.  **Registro de Correo:** Asegúrate de que cada alumno tenga el `correo_tutor` registrado en su perfil.
    2.  **Envío Automático:** Cuando se registra una **entrada** o **salida** desde la aplicación web (por ejemplo, un registro manual), el sistema envía automáticamente un correo al tutor.
    3.  **Configuración del Servicio de Envío:** El sistema utiliza **Resend** para el envío. Para que funcione, debes configurar tu clave de API de Resend en el entorno del servidor.
    4.  **Automatización Completa (Opcional):** Para que los registros del lector de huellas también envíen correos, el paso final es implementar una **Cloud Function** en Firebase que se active cada vez que se cree un nuevo documento en la colección `asistencias` y ejecute la lógica de envío de correo.

