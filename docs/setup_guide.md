# Guía de Configuración del Sistema de Asistencia COBACAM (Versión PC Desktop)

Esta guía detalla cómo configurar tu PC con Windows para que funcione como la estación central de registro de huellas y captura de asistencia utilizando el lector **ZKTeco ZK9500**.

---

## 1. Requisitos Previos en tu PC

1.  **Python 3.10+**: Descárgalo desde [python.org](https://www.python.org/). Durante la instalación, marca la casilla **"Add Python to PATH"**.
2.  **Drivers del Sensor**: Instala los drivers oficiales de ZKTeco para el modelo ZK9500.
3.  **Librerías de Python**: Abre una terminal (PowerShell o CMD) y ejecuta:
    ```bash
    pip install firebase-admin pyzkfp
    ```

## 2. Configuración de Firebase

1.  Ve a la Consola de Firebase -> Configuración del Proyecto -> Cuentas de servicio.
2.  Haz clic en **"Generar nueva clave privada"**.
3.  Descarga el archivo, renómbralo como `serviceAccountKey.json` y guárdalo en una carpeta dedicada para el sistema (ej. `C:\COBACAM_SISTEMA`).

---

## 3. Aplicación de Registro (Interfaz Gráfica - GUI)

Crea un archivo llamado `enroll_gui.py` en tu carpeta del sistema y pega el siguiente código. Este programa es el que usará el personal administrativo.

```python
import tkinter as tk
from tkinter import messagebox
import base64
import firebase_admin
from firebase_admin import credentials, firestore
from pyzkfp import ZKFP

class EnrollApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Sistema de Registro - COBACAM")
        self.root.geometry("400x450")
        self.root.configure(bg="#f3f4f6")

        # Inicializar Firebase
        try:
            cred = credentials.Certificate("serviceAccountKey.json")
            if not firebase_admin._apps:
                firebase_admin.initialize_app(cred)
            self.db = firestore.client()
        except Exception as e:
            messagebox.showerror("Error", f"No se pudo conectar a Firebase: {e}")
            root.destroy()

        # Inicializar Sensor
        try:
            self.zkfp = ZKFP()
            self.zkfp.setup()
        except Exception as e:
            messagebox.showerror("Error", f"Sensor no detectado: {e}")

        # UI Elements
        self.label_title = tk.Label(root, text="Registro de Alumnos", font=("Arial", 18, "bold"), bg="#f3f4f6", fg="#1e3a8a")
        self.label_title.pack(py=20)

        self.label_instr = tk.Label(root, text="Ingresa la Matrícula del Alumno:", bg="#f3f4f6")
        self.label_instr.pack()

        self.entry_matricula = tk.Entry(root, font=("Arial", 14), justify='center')
        self.entry_matricula.pack(py=10, px=20)

        self.btn_start = tk.Button(root, text="INICIAR REGISTRO", font=("Arial", 12, "bold"), bg="#1e3a8a", fg="white", 
                                   command=self.enroll, height=2, width=20)
        self.btn_start.pack(py=20)

        self.status_label = tk.Label(root, text="Esperando...", font=("Arial", 10), bg="#f3f4f6", fg="#6b7280")
        self.status_label.pack(py=10)

    def enroll(self):
        matricula = self.entry_matricula.get().strip()
        if not matricula:
            messagebox.showwarning("Atención", "Por favor ingresa una matrícula.")
            return

        # Verificar si el alumno existe
        student_ref = self.db.collection('students').document(matricula)
        student = student_ref.get()

        if not student.exists:
            messagebox.showerror("Error", f"El alumno con matrícula {matricula} no existe en el sistema.")
            return

        student_name = student.to_dict().get('nombre')
        self.status_label.config(text=f"Registrando a: {student_name}\nSensor Activo: Coloque su dedo 3 veces", fg="#1e40af")
        self.root.update()

        templates = []
        for i in range(1, 4):
            self.status_label.config(text=f"Captura {i} de 3... Coloque el dedo")
            self.root.update()
            
            template = None
            while not template:
                template = self.zkfp.capture()
            
            templates.append(template)
            self.status_label.config(text=f"Captura {i} exitosa!")
            self.root.update()

        try:
            final_template = self.zkfp.enroll(templates)
            encoded_template = base64.b64encode(final_template).decode('utf-8')
            
            student_ref.update({'fingerprintTemplate': encoded_template})
            
            self.root.configure(bg="#d1fae5") # Cambiar fondo a verde
            self.status_label.config(text="¡ALUMNO REGISTRADO CON ÉXITO!", fg="#065f46", font=("Arial", 12, "bold"))
            messagebox.showinfo("Éxito", f"Huella vinculada correctamente a {student_name}")
            self.root.configure(bg="#f3f4f6")
            self.entry_matricula.delete(0, tk.END)
        except Exception as e:
            messagebox.showerror("Error", f"Error al procesar huella: {e}")

if __name__ == "__main__":
    root = tk.Tk()
    app = EnrollApp(root)
    root.mainloop()
```

---

## 4. Script de Asistencia con Notificación por Correo

Crea un archivo llamado `attendance.py`. Este script debe estar abierto durante las horas de entrada/salida.

```python
import time
import datetime
import base64
import smtplib
from email.mime.text import MIMEText
import firebase_admin
from firebase_admin import credentials, firestore
from pyzkfp import ZKFP

# CONFIGURACIÓN DE CORREO (SMTP)
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
EMAIL_USER = "tu-correo@gmail.com" # Cambiar por tu correo
EMAIL_PASS = "tu-contraseña-de-aplicacion" # Contraseña de aplicación de Google

def send_local_email(to_email, student_name, record_type, timestamp):
    if not to_email: return
    
    time_str = timestamp.strftime("%I:%M %p")
    msg_content = f"Estimado tutor, le informamos que {student_name} ha registrado su {record_type} hoy a las {time_str}."
    
    msg = MIMEText(msg_content)
    msg['Subject'] = f"Aviso de Asistencia - {student_name}"
    msg['From'] = f"COBACAM Chicbul <{EMAIL_USER}>"
    msg['To'] = to_email

    try:
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(EMAIL_USER, EMAIL_PASS)
        server.sendmail(EMAIL_USER, to_email, msg.as_string())
        server.quit()
        print(f"Correo enviado a {to_email}")
    except Exception as e:
        print(f"Error al enviar correo: {e}")

# INICIALIZACIÓN
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)
db = firestore.client()
zkfp = ZKFP()
zkfp.setup()

def load_templates():
    print("Sincronizando huellas...")
    students = db.collection('students').where('fingerprintTemplate', '!=', None).stream()
    return {s.id: (base64.b64decode(s.to_dict()['fingerprintTemplate']), s.to_dict()) for s in students}

templates = load_templates()

while True:
    print("\nEsperando huella...")
    live_img = zkfp.capture()
    if not live_img: continue

    for sid, (stored_temp, data) in templates.items():
        if zkfp.match_template(live_img, stored_temp):
            now = datetime.datetime.now()
            # Lógica simple de entrada/salida
            # ... (puedes añadir lógica de checking aquí)
            tipo = "entrada" 
            
            db.collection('asistencias').add({
                'studentId': sid,
                'studentName': data['nombre'],
                'timestamp': now,
                'type': tipo
            })
            
            print(f"Asistencia: {data['nombre']} ({tipo})")
            send_local_email(data.get('correo_tutor'), data['nombre'], tipo, now)
            break
    time.sleep(1)
```
