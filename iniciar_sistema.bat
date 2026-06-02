@echo off
echo Iniciando Sistema de Asistencia COBACAM...

:: 1. Iniciar el Backend (Python)
:: Es fundamental activar el entorno virtual y luego ejecutar el script que controla el sensor.
start "Servidor Biometrico" cmd /k "cd /d %~dp0docs && venv\Scripts\activate && python enroll_gui.py"

:: 2. Iniciar el Frontend (Next.js)
:: Esperamos un par de segundos para que el servidor de Python inicie primero
timeout /t 3
start "Frontend Web" cmd /k "cd /d %~dp0 && npm run dev"

echo Sistema iniciado. Si el sensor no enciende, revisa la ventana de 'Servidor Biometrico'.
pause