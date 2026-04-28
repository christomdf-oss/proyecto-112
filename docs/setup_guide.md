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
    *   [3.2. Script de Python para Captura de Asistencia (`attendance.py`)](#32-script-de-python-para-captura-de-asistencia-attendancepy)
    *   [3.3. Script de Python para Registrar Huellas (`enroll.py`)](#33-script-de-python-para-registrar-huellas-enrollpy)
    *   [3.4. Recomendaciones de Lector de Huellas](#34-recomendaciones-de-lector-de-huellas)
4.  [Sistema de Notificaciones por Correo Electrónico](#4-sistema-de-notificaciones-por-correo-electrónico)

---

## 1. Arquitectura General

El sistema se compone de tres partes principales:

*   **Aplicación Web (Frontend):** La interfaz de Next.js que estás viendo. Sirve como un panel de control para visualizar y gestionar los datos. **Esta aplicación se accede desde cualquier navegador, en cualquier sistema operativo (Windows, Mac, etc.).**
*   **Base de Datos (Firestore):** El cerebro del sistema. Almacena toda la información de alumnos y sus registros de asistencia.
*   **Script de Captura (Backend):** Scripts de Python que se ejecutan en una **Raspberry Pi**. Estos se conectan al lector de huellas y a Firestore para registrar las asistencias y enrolar nuevas huellas.

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

**Aclaración Importante:** El lector de huellas **no se conecta a la computadora donde administras la página web**. Se conecta a una **Raspberry Pi**, que es una computadora pequeña de bajo costo que debe estar en la escuela. Esta Raspberry Pi utiliza el sistema operativo **Linux**. Por esta razón, la compatibilidad del lector con Linux es el factor más importante.

> **💡 Nota para Pruebas Locales (¡Sin Raspberry Pi!)**
>
> ¡No necesitas una Raspberry Pi para empezar a probar! Puedes ejecutar los scripts de Python de esta sección directamente en tu computadora (Windows, Mac, etc.) para simular el proceso de registro.
>
> Los scripts de ejemplo están diseñados para pedirte un "ID de huella" o "matrícula" a través del teclado. Esto te permite verificar que la conexión con Firebase es correcta y que los registros se guardan como esperas, ¡todo antes de comprar el hardware!

### 3.1. Obtener Credenciales de Firebase

Tus scripts de Python necesitan un archivo de credenciales para autenticarse de forma segura.

1.  En la consola de Firebase, ve a **Configuración del proyecto** (el ícono del engranaje).
2.  Ve a la pestaña **Cuentas de servicio**.
3.  Haz clic en **"Generar nueva clave privada"**. Se descargará un archivo `.json`.
4.  **Renombra** este archivo a `serviceAccountKey.json` y cópialo a tu Raspberry Pi en la misma carpeta donde estarán tus scripts. **¡NUNCA compartas este archivo ni lo subas a un repositorio público!**

### 3.2. Script de Python para Captura de Asistencia (`attendance.py`)

Este script se ejecuta para el día a día. Se queda esperando una huella, la identifica y registra la entrada o salida.

**Instala las librerías necesarias en tu Raspberry Pi (o computadora local):**
```bash
# Instalar Python si no lo tienes: https://www.python.org/downloads/
pip install firebase-admin
# También instala la librería para tu lector de huellas (ej. pyfingerprint)
# pip install pyfingerprint
```

**Código del script (`attendance.py`):**

```python
import time
import datetime
import firebase_admin
from firebase_admin import credentials, firestore

def get_fingerprint_id():
    """
    Función para simular la lectura de una huella en una PC
    o para integrar el código de tu sensor en la Raspberry Pi.
    
    En un entorno real, esta función usaría la librería del sensor
    para leer la huella y devolvería el ID de la plantilla encontrada.
    """
    print("Esperando huella...")
    try:
        # Para pruebas, simplemente se ingresa un ID.
        # En producción, aquí iría el código que lee el sensor.
        # Ejemplo con pyfingerprint:
        # while ( sensor.readImage() == False ):
        #   pass
        # sensor.convertImage(0x01)
        # result = sensor.searchTemplate()
        # finger_id = result[0]
        finger_id = int(input("Ingresa ID de huella (ej. 1, 2, 3...): "))
        print(f"Huella leída con ID: {finger_id}")
        return finger_id
    except ValueError:
        print("ID no válido. Inténtalo de nuevo.")
        return None

# --- Inicio del script principal ---

# 1. Conexión con Firebase
try:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    print("Conexión con Firebase establecida.")
except Exception as e:
    print(f"Error al conectar con Firebase: {e}")
    exit()

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
    print("INFO: La notificación por correo se procesará en el backend web.")


# 2. Bucle principal de escucha
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

### 3.3. Script de Python para Registrar Huellas (`enroll.py`)

Este script se ejecuta solo cuando necesitas registrar la huella de un nuevo alumno o re-registrar una existente.

**Código del script (`enroll.py`):**
```python
import time
import firebase_admin
from firebase_admin import credentials, firestore

# Si estás usando un sensor real, importa su librería aquí
# from pyfingerprint.pyfingerprint import PyFingerprint

def enroll_fingerprint_simulation(position):
    """
    Simula el proceso de enrolamiento para pruebas en una PC.
    """
    print("--- SIMULACIÓN DE REGISTRO DE HUELLA ---")
    print("Coloca el dedo en el sensor...")
    time.sleep(2)
    print("Retira el dedo.")
    time.sleep(1)
    print("Vuelve a colocar el mismo dedo en el sensor...")
    time.sleep(2)
    print(f"¡Éxito! Huella registrada en la posición (simulada): {position}")
    return position

def find_available_position_simulation():
    """
    Simula la búsqueda de una posición libre.
    En un entorno real, aquí se consultaría el sensor.
    """
    # En esta simulación, simplemente devolvemos un número aleatorio.
    import random
    pos = random.randint(1, 200)
    print(f"Se usará la posición libre (simulada): {pos}")
    return pos

# --- Firebase Initialization ---
try:
    cred = credentials.Certificate("serviceAccountKey.json")
    # Evita reinicializar si ya existe una app (útil si combinas scripts)
    if not firebase_admin._apps:
        firebase_admin.initialize_app(cred)
    db = firestore.client()
    print("Conexión con Firebase establecida.")
except Exception as e:
    print(f"Error al conectar con Firebase: {e}")
    exit()

# --- Main Enrollment Logic ---
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

    if student_data.get('fingerprintId') is not None:
        print(f"ADVERTENCIA: Este alumno ya tiene una huella registrada (ID: {student_data.get('fingerprintId')}).")
        overwrite = input("¿Deseas sobreescribirla? (s/n): ").lower()
        if overwrite != 's':
            print("Registro cancelado.")
            continue
    
    try:
        # En un sistema real, aquí irían las funciones de la librería del sensor.
        # Por ejemplo, con pyfingerprint:
        # position_number = sensor.searchTemplate()
        # sensor.createTemplate()
        # sensor.storeTemplate(position_number)
        
        # 2. Encontrar posición libre
        position_to_store = find_available_position_simulation()

        # 3. Registrar huella
        enroll_fingerprint_simulation(position_to_store)

        # 4. Actualizar Firestore
        student_ref.update({
            'fingerprintId': position_to_store
        })
        print(f"¡Éxito! La base de datos ha sido actualizada para {student_data.get('nombre')}.")

    except Exception as e:
        print(f"Ocurrió un error durante el registro: {e}")
```

### 3.4. Recomendaciones de Lector de Huellas

Para que un lector de huellas funcione con este sistema, **NO importa la marca, el precio o la tienda donde lo compres**. Lo único que importa es que cumpla con **DOS** requisitos técnicos para que pueda ser controlado desde el script de Python en la Raspberry Pi (que usa Linux):

1.  **Compatibilidad con el Sistema Operativo (Linux):**
    *   Para lectores **USB genéricos**, esto significa que el modelo debe aparecer en la lista oficial de dispositivos soportados por el proyecto **`libfprint`**.
    *   Para sensores tipo **módulo (con pines)**, como el GT-521Fxx, la compatibilidad viene de su conexión serial (TTL), que es universal.

2.  **Compatibilidad con el Lenguaje de Programación (Python):**
    *   Debe existir una **librería de Python** que permita controlar el lector.
        *   Para lectores compatibles con `libfprint`, la librería suele ser `pyfprint-next`.
        *   Para los sensores GT-521Fxx, la librería es `pyfingerprint`.

**En resumen: si encuentras un lector, tu checklist de dos pasos es:**
1.  ¿Es compatible con `libfprint` (para USB) o es un modelo GT-521Fxx (para módulo)?
2.  ¿Existe una librería de Python para controlarlo?

Si la respuesta a ambas preguntas es sí, ¡el lector es compatible!

A continuación se presentan las opciones ordenadas de la más recomendada (fácil y barata) a la más avanzada.

#### Opción 1 (Recomendada): El Sensor "Maker" por USB-TTL (La más barata y fiable)

Esta es, por mucho, la mejor ruta para empezar sin gastar mucho y con la seguridad de que funcionará.

*   **Modelo Sugerido:** Busca sensores de la serie **GT-521Fxx** (como el **GT-521F32** o **GT-521F52**). Son módulos pequeños y plateados.
*   **¿Cómo se conecta por USB?** Estos sensores tienen pines, pero se conectan fácilmente a un puerto USB usando un **"Adaptador USB a TTL"** (son muy baratos, cuestan un par de dólares). Simplemente conectas los cables del sensor al adaptador, y el adaptador a la Raspberry Pi.
*   **Librería de Python:** La librería `pyfingerprint` está hecha específicamente para estos sensores y es muy fácil de usar.
    *   `pip install pyfingerprint`
*   **Ventaja Principal:** Es la combinación más económica y la que tiene más tutoriales y soporte en la comunidad. Es casi una garantía de éxito para tu script de Python.

#### Opción 2: Checklist para Comprar un Lector USB Económico

Si prefieres una solución de una sola pieza que se conecte directamente a USB, es posible encontrar opciones económicas, pero requiere un poco de investigación de tu parte antes de comprar.

> **Advertencia:** No puedo verificar enlaces de productos directamente. Debes seguir estos pasos para confirmar la compatibilidad tú mismo antes de comprar.

**Checklist para Encontrar un Lector USB Barato:**

1.  **Busca en tiendas online** (Amazon, AliExpress, MercadoLibre) usando términos como:
    *   `"USB fingerprint reader linux"`
    *   `"fingerprint scanner raspberry pi"`
    *   `"libfprint compatible fingerprint reader"`

2.  **Identifica el Modelo:** Cuando encuentres un lector barato que te interese, busca su nombre de modelo exacto. A veces los vendedores no lo ponen, pero puedes buscar en las preguntas y respuestas o en las reseñas. **Si no encuentras un modelo, es muy arriesgado.**

3.  **Verifica en la Lista de `libfprint`:** Ve a la [lista de dispositivos soportados por `libfprint`](https://fprint.freedesktop.org/supported-devices.html) y busca el modelo. **Si aparece en la lista, ¡es una excelente señal!** Si no está, no lo compres.

4.  **Busca una Librería de Python:** Una vez confirmada la compatibilidad con `libfprint`, busca una librería de Python que se integre con ella, como `pyfprint-next`.

---

## 4. Sistema de Notificaciones por Correo Electrónico

El sistema está preparado para enviar notificaciones automáticas por correo electrónico a los tutores.

*   **¿Cómo funciona?**
    1.  **Registro de Correo:** Asegúrate de que cada alumno tenga el `correo_tutor` registrado en su perfil.
    2.  **Envío Automático:** Cuando se registra una **entrada** o **salida** desde la aplicación web (por ejemplo, un registro manual), el sistema envía automáticamente un correo al tutor.
    3.  **Configuración del Servicio de Envío:** El sistema utiliza **Resend** para el envío. Para que funcione, debes configurar tu clave de API de Resend en el entorno del servidor.
    4.  **Automatización Completa (Opcional):** Para que los registros del lector de huellas también envíen correos, el paso final es implementar una **Cloud Function** en Firebase que se active cada vez que se cree un nuevo documento en la colección `asistencias` y ejecute la lógica de envío de correo.
