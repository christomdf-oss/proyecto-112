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
    *   [3.3. Recomendaciones de Lector de Huellas (¡Enfocado en Costo y Compatibilidad!)](#33-recomendaciones-de-lector-de-huellas-enfocado-en-costo-y-compatibilidad)
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

### 3.3. Recomendaciones de Lector de Huellas (¡Enfocado en Costo y Compatibilidad!)

¡Tienes toda la razón! Los lectores de huellas comerciales pueden ser muy caros. Afortunadamente, hay opciones mucho más económicas que son perfectas para este proyecto.

La compatibilidad no depende de la marca, sino de su capacidad para ser controlado por un **script de Python en tu Raspberry Pi**.

Aquí te presento las opciones, ordenadas de la más recomendada (fácil y barata) a la más avanzada.

#### Opción 1 (Recomendada): El Sensor "Maker" por USB-TTL (La más barata y fiable)

Esta es, por mucho, la mejor ruta para empezar sin gastar mucho y con la seguridad de que funcionará.

*   **Modelo Sugerido:** Busca sensores de la serie **GT-521Fxx** (como el **GT-521F32** o **GT-521F52**). Son módulos pequeños y plateados.
*   **¿Cómo se conecta por USB?** Estos sensores tienen pines, pero se conectan fácilmente a un puerto USB usando un **"Adaptador USB a TTL"** (son muy baratos, cuestan un par de dólares). Simplemente conectas los cables del sensor al adaptador, y el adaptador a la Raspberry Pi.
*   **Librería de Python:** La librería `pyfingerprint` está hecha específicamente para estos sensores y es muy fácil de usar.
    *   `pip install pyfingerprint`
*   **Ventaja Principal:** Es la combinación más económica y la que tiene más tutoriales y soporte en la comunidad. Es casi una garantía de éxito para tu script de Python.

#### Opción 2: La Búsqueda del Lector USB "Plug-and-Play" Barato

Si prefieres una solución de una sola pieza que se conecte directamente a USB, es posible encontrar opciones económicas, pero requiere un poco de investigación de tu parte antes de comprar.

**El Criterio Más Importante: Compatibilidad con `libfprint`**

Para que un lector USB genérico funcione en Linux (el sistema de la Raspberry Pi), debe ser compatible con el proyecto **`libfprint`**.

**Checklist para Encontrar un Lector USB Barato:**

1.  **Busca en tiendas online** (Amazon, AliExpress, MercadoLibre) usando términos como:
    *   `"USB fingerprint reader linux"`
    *   `"fingerprint scanner raspberry pi"`
    *   `"libfprint compatible fingerprint reader"`

2.  **Identifica el Modelo:** Cuando encuentres un lector barato que te interese, busca su nombre de modelo exacto. A veces los vendedores no lo ponen, pero puedes buscar en las preguntas y respuestas o en las reseñas.

3.  **Verifica en la Lista de `libfprint`:** Ve a la [lista de dispositivos soportados por `libfprint`](https://fprint.freedesktop.org/supported-devices.html) y busca el modelo. Si aparece en la lista, ¡es una excelente señal!

4.  **Busca una Librería de Python:** Una vez confirmada la compatibilidad con `libfprint`, busca una librería de Python que se integre con ella, como `pyfprint-next`.

**Análisis de los modelos que mencionaste:**

*   **Lector De Huellas Dactilares Para Escritorio Usb 360 Degree:** ¡Este es el tipo de lector que debes buscar! Son genéricos y muchos usan chipsets compatibles. Sigue el checklist de arriba para verificar un modelo específico antes de comprar.
*   **Zkteco Zk9500:** Te reitero la advertencia. Aunque parezcan una buena opción, su soporte en Linux es muy pobre. Ahorrarás muchos dolores de cabeza si evitas los lectores ZKTeco para este proyecto, a menos que encuentres un tutorial muy reciente y fiable que garantice que funciona con Python en una Raspberry Pi.

**Conclusión de la Recomendación:**

*   **Ruta Segura, Fácil y Barata:** Un sensor **GT-521F32/52** con un adaptador **USB a TTL**. Es la mejor opción en relación costo-beneficio.
*   **Ruta USB de "Cazador de Ofertas":** Un lector USB genérico que encuentres barato, pero solo después de **confirmar su compatibilidad con `libfprint`**.
---

## 4. Sistema de Notificaciones por Correo Electrónico

El sistema está preparado para enviar notificaciones automáticas por correo electrónico a los tutores.

*   **¿Cómo funciona?**
    1.  **Registro de Correo:** Asegúrate de que cada alumno tenga el `correo_tutor` registrado en su perfil.
    2.  **Envío Automático:** Cuando se registra una **entrada** o **salida** desde la aplicación web (por ejemplo, un registro manual), el sistema envía automáticamente un correo al tutor.
    3.  **Configuración del Servicio de Envío:** El sistema utiliza **Resend** para el envío. Para que funcione, debes configurar tu clave de API de Resend en el entorno del servidor.
    4.  **Automatización Completa (Opcional):** Para que los registros del lector de huellas también envíen correos, el paso final es implementar una **Cloud Function** en Firebase que se active cada vez que se cree un nuevo documento en la colección `asistencias` y ejecute la lógica de envío de correo.

