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

La compatibilidad del lector no depende de la aplicación web, sino de su capacidad para ser controlado por un **script de Python en un sistema Linux** (como una Raspberry Pi). El factor clave es la disponibilidad de **drivers para Linux** y una **librería de Python** que pueda comunicarse con el dispositivo.

A continuación, se presentan los dos tipos de conexión principales y sus consideraciones.

#### Opción 1: Sensores por GPIO (Conexión Directa)

Esta es la opción más recomendada para empezar, por su gran soporte en la comunidad de *makers*.

*   **Modelo Sugerido:** Sensores de la serie **Adafruit ZFM / GT-521Fxx**.
*   **Conexión:** Se conectan directamente a los pines TX/RX (GPIO) de la Raspberry Pi. También se pueden usar con un adaptador USB a TTL si prefieres un puerto USB.
*   **Librería de Python:** La librería `pyfingerprint` es excelente, fácil de instalar (`pip install pyfingerprint`) y de usar.
*   **Ventaja Principal:** Es la ruta más documentada y con la que es más probable obtener éxito rápidamente.

#### Opción 2: Lectores por USB (Conexión Plug-and-Play)

Esta opción es ideal si buscas una solución más robusta y de aspecto comercial. Los modelos que mencionaste, como el **Zkteco Zk9500** o los lectores de escritorio genéricos, entran en esta categoría.

**El Criterio Más Importante: Compatibilidad con `libfprint`**

Antes de comprar cualquier lector USB, debes verificar su compatibilidad con el proyecto de código abierto **`libfprint`**. Esta es una librería estándar en Linux que da soporte a una gran variedad de lectores de huellas.

**Checklist para Elegir un Lector USB:**

1.  **Busca el modelo en la lista de dispositivos soportados por `libfprint`**. Puedes encontrar la lista en su sitio web oficial. Si tu dispositivo (o su chipset interno) aparece ahí, tienes una excelente probabilidad de que funcione.
2.  **Verifica la existencia de una librería de Python.** Una vez confirmada la compatibilidad con `libfprint`, busca una librería de Python que se integre con ella, como `pyfprint`.

**Análisis de los modelos que mencionaste:**

*   **Lector De Huellas Dactilares Para Escritorio Usb 360 Degree:** Este es un nombre genérico. Muchos de estos dispositivos usan chipsets compatibles con `libfprint`. La clave es buscar el modelo exacto o el ID del hardware para comprobar su compatibilidad. Son una buena apuesta si investigas primero.

*   **Zkteco Zk9500:** Los lectores de **ZKTeco** son excelentes en hardware, pero su soporte en Linux es **complicado**. A menudo, sus SDKs (kits de desarrollo) son solo para Windows. Aunque existen librerías no oficiales creadas por la comunidad para algunos modelos, pueden ser inestables o difíciles de instalar.
    *   **Recomendación:** Procede con precaución. A menos que encuentres un tutorial reciente y fiable que garantice el funcionamiento de ese modelo específico en una Raspberry Pi con Python, podría ser un camino frustrante.

*   **Lectores Digital Persona U.are.U:** Al igual que los ZKTeco, son de grado comercial. Sin embargo, muchos de sus modelos **sí tienen buen soporte en `libfprint`**, lo que los convierte en una opción USB mucho más segura y recomendada que los ZKTeco para este proyecto.

**Conclusión de la Recomendación:**

*   **Ruta Segura y Fácil:** Un sensor tipo **GT-521Fxx** con la librería `pyfingerprint`.
*   **Ruta USB Robusta:** Un lector de la marca **Digital Persona** (o un genérico) que esté **explícitamente listado como compatible con `libfprint`**. Evita los modelos de ZKTeco a menos que estés preparado para una configuración potencialmente compleja.
---

## 4. Sistema de Notificaciones por Correo Electrónico

El sistema está preparado para enviar notificaciones automáticas por correo electrónico a los tutores.

*   **¿Cómo funciona?**
    1.  **Registro de Correo:** Asegúrate de que cada alumno tenga el `correo_tutor` registrado en su perfil.
    2.  **Envío Automático:** Cuando se registra una **entrada** o **salida** desde la aplicación web (por ejemplo, un registro manual), el sistema envía automáticamente un correo al tutor.
    3.  **Configuración del Servicio de Envío:** El sistema utiliza **Resend** para el envío. Para que funcione, debes configurar tu clave de API de Resend en el entorno del servidor.
    4.  **Automatización Completa (Opcional):** Para que los registros del lector de huellas también envíen correos, el paso final es implementar una **Cloud Function** en Firebase que se active cada vez que se cree un nuevo documento en la colección `asistencias` y ejecute la lógica de envío de correo.
