import os
import time
import json
import base64
import threading
import smtplib

from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from datetime import datetime

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO

import firebase_admin
from firebase_admin import credentials, firestore as fs

# =========================================
# DLL ZK
# =========================================

os.add_dll_directory(os.getcwd())

from pyzkfp import ZKFP2

import clr
from System import Array, Byte

# =========================================
# CONFIG
# =========================================

GMAIL_USER     = "christomdf@gmail.com"
GMAIL_PASSWORD = "xiso lsyj kgiz wvzo"
STUDENTS_FILE  = "students.json"

# =========================================
# FIREBASE ADMIN
# Usa el mismo serviceAccountKey.json que ya tienes en /docs
# =========================================

cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)
db = fs.client()

# =========================================
# APP
# =========================================

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# =========================================
# VARIABLES GLOBALES
# =========================================

sensor_lock     = threading.Lock()
attendance_mode = False
attendance_type = "entrada"
attendance_thread = None
students_db     = {}

# =========================================
# SENSOR
# =========================================

zkfp = ZKFP2()
print("[INIT] Inicializando SDK...")
zkfp.Init()
print("[INIT] Abriendo dispositivo...")
zkfp.OpenDevice(0)
print("[INIT] Sensor listo.")

# =========================================
# HELPERS
# =========================================

def next_sensor_id():
    if not students_db:
        return 1
    return max(students_db.keys()) + 1

def find_sensor_id_by_matricula(matricula: str):
    for sid, alumno in students_db.items():
        if str(alumno.get("matricula", "")) == str(matricula):
            return sid
    return None

# =========================================
# SAVE / LOAD JSON
# =========================================

def save_students():
    data = {}
    for sid, alumno in students_db.items():
        template_bytes = bytearray(alumno["template"])
        data[str(sid)] = {
            "nombre":    alumno["nombre"],
            "correo":    alumno["correo"],
            "matricula": alumno.get("matricula", str(sid)),
            "template":  base64.b64encode(template_bytes).decode()
        }
    with open(STUDENTS_FILE, "w") as f:
        json.dump(data, f, indent=4)
    print(f"[SAVE] {len(data)} alumnos guardados en {STUDENTS_FILE}")

def load_students():
    global students_db
    if not os.path.exists(STUDENTS_FILE):
        print("[LOAD] No existe students.json — empezando vacío.")
        return
    with open(STUDENTS_FILE, "r") as f:
        data = json.load(f)
    loaded = 0
    errors = 0
    for sid, alumno in data.items():
        sid_int = int(sid)
        try:
            template_bytes = base64.b64decode(alumno["template"])
            template = Array[Byte](template_bytes)
            students_db[sid_int] = {
                "nombre":    alumno["nombre"],
                "correo":    alumno["correo"],
                "matricula": alumno.get("matricula", sid),
                "template":  template
            }
            zkfp.DBAdd(sid_int, template)
            loaded += 1
            print(f"[LOAD] ✓ sensor_id:{sid_int} matricula:{alumno.get('matricula', sid)} — {alumno['nombre']}")
        except Exception as e:
            errors += 1
            print(f"[LOAD] ✗ Error en alumno {sid_int}: {e}")
    print(f"[LOAD] Completado: {loaded} cargados, {errors} errores.")

load_students()

# =========================================
# GUARDAR ASISTENCIA EN FIRESTORE
# =========================================

def guardar_asistencia_firestore(matricula, nombre, tipo):
    """
    Guarda el registro en la colección 'asistencias' de Firestore.
    El frontend lee exactamente esta colección con los campos:
    studentId, studentName, timestamp, type.
    """
    try:
        doc_ref = db.collection("asistencias").document()
        doc_ref.set({
            "studentId":   matricula,
            "studentName": nombre,
            "timestamp":   fs.SERVER_TIMESTAMP,
            "type":        tipo,
            "isManual":    False,
        })
        print(f"[FIRESTORE] ✓ Asistencia guardada — {nombre} ({tipo})")
    except Exception as e:
        print(f"[FIRESTORE ERROR]: {e}")

# =========================================
# EMAIL
# =========================================

def enviar_correo(destinatario, nombre, tipo):
    try:
        asunto = f"Asistencia registrada - {tipo.upper()}"
        cuerpo = f"""
Hola.

Se registró correctamente la {tipo} del alumno:

Nombre: {nombre}
Hora: {datetime.now().strftime('%H:%M:%S')}

Sistema Biométrico COBACAM.
"""
        mensaje = MIMEMultipart()
        mensaje["From"]    = GMAIL_USER
        mensaje["To"]      = destinatario
        mensaje["Subject"] = asunto
        mensaje.attach(MIMEText(cuerpo, 'plain'))

        servidor = smtplib.SMTP('smtp.gmail.com', 587)
        servidor.starttls()
        servidor.login(GMAIL_USER, GMAIL_PASSWORD)
        servidor.sendmail(GMAIL_USER, destinatario, mensaje.as_string())
        servidor.quit()
        print(f"[EMAIL] ✓ Enviado a {destinatario}")
    except Exception as e:
        print(f"[ERROR EMAIL]: {e}")

# =========================================
# EXTRAER TEMPLATE
# =========================================

def extract_template(obj):
    try:
        if "System.Byte[]" in str(type(obj)):
            return obj
    except:
        pass
    if isinstance(obj, (tuple, list)):
        for item in obj:
            try:
                if "System.Byte[]" in str(type(item)):
                    return item
            except:
                pass
            if isinstance(item, (bytes, bytearray)):
                return Array[Byte](item)
    if isinstance(obj, (bytes, bytearray)):
        return Array[Byte](obj)
    raise Exception(f"Template inválido — tipo recibido: {type(obj)}")

# =========================================
# REGISTRAR ASISTENCIA
# =========================================

def registrar_asistencia(sensor_id, tipo):
    alumno = students_db.get(sensor_id)
    if not alumno:
        print(f"[ERROR] sensor_id {sensor_id} no encontrado.")
        return

    matricula = alumno.get("matricula", str(sensor_id))
    nombre    = alumno["nombre"]
    correo    = alumno.get("correo", "")
    hora      = datetime.now().strftime("%H:%M:%S")

    print("\n===================================")
    print(f"ALUMNO:    {nombre}")
    print(f"MATRICULA: {matricula}")
    print(f"TIPO:      {tipo}")
    print(f"HORA:      {hora}")
    print("===================================\n")

    # 1. Guardar en Firestore para que el frontend lo muestre
    guardar_asistencia_firestore(matricula, nombre, tipo)

    # 2. Enviar correo al tutor
    if correo:
        threading.Thread(
            target=enviar_correo,
            args=(correo, nombre, tipo),
            daemon=True
        ).start()

    # 3. Emitir socket — evento 'attendance_marked' que escucha el frontend
    socketio.emit('attendance_marked', {
        'studentId':   matricula,
        'studentName': nombre,
        'action':      tipo,
        'hora':        hora
    })

# =========================================
# LOOP ASISTENCIA
# =========================================

def attendance_loop():
    global attendance_mode
    print("[LOOP] Attendance iniciado.")
    while attendance_mode:
        try:
            with sensor_lock:
                result = zkfp.AcquireFingerprint()
            if not result:
                time.sleep(0.2)
                continue

            print("[HUELLA] Huella detectada.")
            template = Array[Byte](result[0])

            with sensor_lock:
                identify = zkfp.DBIdentify(template)

            print(f"[IDENTIFY]: {identify}")

            sensor_id = 0
            if isinstance(identify, (tuple, list)):
                sensor_id = identify[0]
            elif isinstance(identify, int):
                sensor_id = identify

            if sensor_id != 0 and sensor_id in students_db:
                print(f"[OK] Reconocido — sensor_id:{sensor_id} nombre:{students_db[sensor_id]['nombre']}")
                registrar_asistencia(sensor_id, attendance_type)
                time.sleep(3)
            else:
                print(f"[NO MATCH] sensor_id={sensor_id} no está en la DB.")
                socketio.emit('attendance_error', {'error': 'Huella no reconocida'})
                time.sleep(2)

        except Exception as e:
            print(f"[ERROR LOOP]: {e}")
            time.sleep(2)

# =========================================
# ENDPOINTS
# =========================================

@app.route('/api/attendance-status', methods=['GET'])
def attendance_status():
    return jsonify({
        "status":          "connected",
        "students_loaded": len(students_db),
        "attendance_mode": attendance_mode,
        "attendance_type": attendance_type
    })


@app.route('/api/start-attendance', methods=['POST'])
def start_attendance():
    global attendance_mode, attendance_thread, attendance_type
    data = request.json or {}
    attendance_type = data.get("type", "entrada")
    if attendance_mode:
        return jsonify({"success": False, "error": "Ya está en modo asistencia"})
    attendance_mode = True
    attendance_thread = threading.Thread(target=attendance_loop, daemon=True)
    attendance_thread.start()
    print(f"[ASISTENCIA] Modo '{attendance_type}' iniciado.")
    return jsonify({"success": True})


@app.route('/api/stop-attendance', methods=['POST'])
def stop_attendance():
    global attendance_mode
    attendance_mode = False
    print("[ASISTENCIA] Sistema detenido.")
    return jsonify({"success": True})


@app.route('/api/enroll', methods=['POST'])
def enroll_fingerprint():
    try:
        data = request.json or {}
        print(f"[ENROLL] Payload recibido: {data}")

        matricula = str(data.get("matricula") or data.get("id") or "")
        nombre    = data.get("nombre") or data.get("name") or f"Alumno {matricula}"
        correo    = data.get("correo") or data.get("email") or ""

        if not matricula:
            return jsonify({"success": False, "error": "Matrícula requerida"}), 400

        existing_sid = find_sensor_id_by_matricula(matricula)
        if existing_sid:
            sensor_id = existing_sid
            print(f"[ENROLL] Re-enrolando — sensor_id:{sensor_id}")
            try:
                zkfp.DBDel(sensor_id)
            except Exception:
                pass
        else:
            sensor_id = next_sensor_id()

        print(f"[ENROLL] sensor_id:{sensor_id} | matricula:{matricula} | nombre:{nombre}")

        fps_clr = []
        with sensor_lock:
            while len(fps_clr) < 3:
                result = zkfp.AcquireFingerprint()
                if not result:
                    time.sleep(0.2)
                    continue
                fp = Array[Byte](result[0])
                fps_clr.append(fp)
                print(f"[CAPTURA] Muestra {len(fps_clr)}/3")
                time.sleep(1)

            merge_result   = zkfp.DBMerge(fps_clr[0], fps_clr[1], fps_clr[2])
            final_template = extract_template(merge_result)
            zkfp.DBAdd(sensor_id, final_template)

            students_db[sensor_id] = {
                "nombre":    nombre,
                "correo":    correo,
                "matricula": matricula,
                "template":  final_template
            }
            save_students()

        template_b64 = base64.b64encode(bytearray(final_template)).decode()
        print(f"[OK] Registrado — sensor_id:{sensor_id} nombre:{nombre} matricula:{matricula}")

        return jsonify({
            "success":   True,
            "id":        sensor_id,
            "matricula": matricula,
            "nombre":    nombre,
            "template":  template_b64
        })

    except Exception as e:
        print(f"[ERROR ENROLL]: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/students', methods=['GET'])
def list_students():
    alumnos = [
        {
            "sensor_id": sid,
            "matricula": a.get("matricula", str(sid)),
            "nombre":    a["nombre"],
            "correo":    a["correo"]
        }
        for sid, a in students_db.items()
    ]
    return jsonify({"students": alumnos})

# =========================================
# SOCKET
# =========================================

@socketio.on('connect')
def connect():
    print("[SOCKET] Cliente conectado.")

# =========================================
# MAIN
# =========================================

if __name__ == '__main__':
    socketio.run(
        app,
        host='127.0.0.1',
        port=5000,
        debug=False,
        use_reloader=False
    )
