from __future__ import annotations

import base64
import logging
import os
import queue
import threading
import time
from dataclasses import dataclass, field
from enum import Enum, auto
from typing import Any, Callable, Dict, Iterable, List, Optional

import clr
from pyzkfp import ZKFP2

try:
    from System import Array, Byte
except ImportError:
    Array = None
    Byte = None

import firebase_admin
from firebase_admin import credentials, firestore


class HardwareState(Enum):
    DISCONNECTED = auto()
    CONNECTING = auto()
    READY = auto()
    ERROR = auto()
    RECOVERING = auto()


class HardwareCommandType(Enum):
    ENROLL = auto()
    IDENTIFY = auto()
    ATTENDANCE_START = auto()
    ATTENDANCE_STOP = auto()
    REFRESH_TEMPLATES = auto()
    PING = auto()


class HardwareEventType(Enum):
    STATE_CHANGED = auto()
    ERROR = auto()
    ENROLL_COMPLETE = auto()
    IDENTIFY_COMPLETE = auto()
    ATTENDANCE_DETECTED = auto()
    ATTENDANCE_STATUS = auto()
    TEMPLATE_REFRESHED = auto()


@dataclass
class HardwareEvent:
    event_type: HardwareEventType
    payload: Dict[str, Any]
    timestamp: float = field(default_factory=time.time)


@dataclass
class HardwareCommand:
    command_type: HardwareCommandType
    payload: Dict[str, Any] = field(default_factory=dict)
    response_queue: Optional[queue.Queue] = None
    created_at: float = field(default_factory=time.time)


class SingletonMeta(type):
    _instances: Dict[type, Any] = {}
    _lock = threading.Lock()

    def __call__(cls, *args, **kwargs):
        with cls._lock:
            if cls not in cls._instances:
                cls._instances[cls] = super().__call__(*args, **kwargs)
        return cls._instances[cls]


class HardwareManager(metaclass=SingletonMeta):
    SERVICE_ACCOUNT_FILE = os.path.join(os.path.dirname(__file__), 'serviceAccountKey.json')
    FIRESTORE_COLLECTION_STUDENTS = 'students'
    FIRESTORE_COLLECTION_ATTENDANCE = 'asistencias'
    IDENTIFICATION_THRESHOLD = int(os.environ.get('ATTENDANCE_IDENTIFICATION_THRESHOLD', '50'))
    RECONNECT_INTERVAL = 5.0
    COMMAND_WAIT = 0.2
    ATTENDANCE_POLL_INTERVAL = 0.3

    def __init__(self):
        self._state = HardwareState.DISCONNECTED
        self._state_lock = threading.RLock()
        self._command_queue: queue.Queue[HardwareCommand] = queue.Queue()
        self._listeners: List[Callable[[HardwareEvent], None]] = []
        self._listeners_lock = threading.RLock()
        self._stop_event = threading.Event()
        self._sdk: Optional[ZKFP2] = None
        self._template_cache: Dict[str, Dict[str, Any]] = {}
        self._attendance_active = False
        self._attendance_mode = 'entrada'
        self._last_connect_attempt = 0.0
        self._firestore: Optional[firestore.Client] = None
        self._worker_thread = threading.Thread(target=self._worker_loop, name='HardwareManagerWorker', daemon=True)
        self._initialize_firestone()
        self._worker_thread.start()
        self._emit_state(HardwareState.DISCONNECTED)

    def _initialize_firestone(self) -> None:
        if self._firestore is not None:
            return
        try:
            if not os.path.exists(self.SERVICE_ACCOUNT_FILE):
                raise FileNotFoundError(f'serviceAccountKey.json no encontrado en {self.SERVICE_ACCOUNT_FILE}')
            cred = credentials.Certificate(self.SERVICE_ACCOUNT_FILE)
            firebase_admin.initialize_app(cred)
            self._firestore = firestore.client()
            logging.info('[FIRESTORE] Cliente inicializado correctamente.')
            self.enqueue_command(HardwareCommand(HardwareCommandType.REFRESH_TEMPLATES))
        except Exception as exc:
            logging.error('[FIRESTORE] Error inicializando Firestore: %s', exc)
            self._firestore = None
            self._emit_error('Firestore initialization fail', exc)

    def add_listener(self, callback: Callable[[HardwareEvent], None]) -> None:
        with self._listeners_lock:
            self._listeners.append(callback)

    def remove_listener(self, callback: Callable[[HardwareEvent], None]) -> None:
        with self._listeners_lock:
            self._listeners = [listener for listener in self._listeners if listener != callback]

    def enqueue_command(self, command: HardwareCommand) -> None:
        logging.debug('[QUEUE] Encolando comando %s', command.command_type.name)
        self._command_queue.put(command)

    def send_command(self, command_type: HardwareCommandType, payload: Optional[Dict[str, Any]] = None, timeout: float = 10.0) -> Dict[str, Any]:
        response_queue = queue.Queue(maxsize=1)
        command = HardwareCommand(command_type=command_type, payload=payload or {}, response_queue=response_queue)
        self.enqueue_command(command)
        try:
            response = response_queue.get(timeout=timeout)
            return response
        except queue.Empty:
            logging.error('[TIMEOUT] Comando %s sin respuesta en %s segundos', command_type.name, timeout)
            return {'success': False, 'error': f'Timeout waiting for {command_type.name} response'}

    def get_status(self) -> Dict[str, Any]:
        with self._state_lock:
            return {
                'success': True,
                'state': self._state.name,
                'attendance_active': self._attendance_active,
                'attendance_mode': self._attendance_mode,
                'template_count': len(self._template_cache),
            }

    def start_attendance(self, mode: str = 'entrada') -> Dict[str, Any]:
        if mode not in ('entrada', 'salida'):
            mode = 'entrada'
        self._attendance_mode = mode
        result = self.send_command(HardwareCommandType.ATTENDANCE_START, {'mode': mode})
        return result

    def stop_attendance(self) -> Dict[str, Any]:
        return self.send_command(HardwareCommandType.ATTENDANCE_STOP)

    def enroll(self, timeout: float = 30.0) -> Dict[str, Any]:
        return self.send_command(HardwareCommandType.ENROLL, {'timeout': timeout}, timeout=timeout + 5.0)

    def identify(self, timeout: float = 20.0) -> Dict[str, Any]:
        return self.send_command(HardwareCommandType.IDENTIFY, {}, timeout=timeout + 5.0)

    def stop(self) -> None:
        self._stop_event.set()
        self._command_queue.put(HardwareCommand(HardwareCommandType.PING, {}, None))
        if self._worker_thread.is_alive():
            self._worker_thread.join(timeout=2.0)

    def _emit_event(self, event: HardwareEvent) -> None:
        with self._listeners_lock:
            listeners = list(self._listeners)
        for callback in listeners:
            try:
                callback(event)
            except Exception as exc:
                logging.debug('[EVENT] Error en listener %s: %s', callback, exc)

    def _emit_state(self, new_state: HardwareState) -> None:
        with self._state_lock:
            if self._state == new_state:
                return
            self._state = new_state
        logging.info('[STATE] %s', self._state.name)
        self._emit_event(HardwareEvent(HardwareEventType.STATE_CHANGED, {'state': self._state.name}))

    def _emit_error(self, message: str, exc: Optional[Exception] = None) -> None:
        payload = {'message': message}
        if exc is not None:
            payload['exception'] = str(exc)
        logging.error('[ERROR] %s', payload)
        self._emit_event(HardwareEvent(HardwareEventType.ERROR, payload))

    def _worker_loop(self) -> None:
        logging.info('[WORKER] Iniciando worker biométrico.')
        while not self._stop_event.is_set():
            command = self._take_command(timeout=self.COMMAND_WAIT)
            if command:
                self._handle_command(command)
                continue

            if self._attendance_active:
                self._process_attendance_cycle()
                continue

            time.sleep(self.ATTENDANCE_POLL_INTERVAL)

    def _take_command(self, timeout: float) -> Optional[HardwareCommand]:
        try:
            return self._command_queue.get(timeout=timeout)
        except queue.Empty:
            return None

    def _handle_command(self, command: HardwareCommand) -> None:
        logging.info('[WORKER] Procesando comando %s', command.command_type.name)
        handler_name = f'_cmd_{command.command_type.name.lower()}'
        handler = getattr(self, handler_name, None)
        if handler is None:
            self._reply(command, {'success': False, 'error': f'Comando no soportado: {command.command_type.name}'})
            return
        try:
            response = handler(command.payload)
            self._reply(command, response)
        except Exception as exc:
            self._emit_error(f'Error ejecutando {command.command_type.name}', exc)
            self._reply(command, {'success': False, 'error': str(exc)})

    def _reply(self, command: HardwareCommand, response: Dict[str, Any]) -> None:
        if command.response_queue is not None:
            try:
                command.response_queue.put_nowait(response)
            except queue.Full:
                logging.warning('[REPLY] No se pudo enviar respuesta de %s, cola llena', command.command_type.name)

    def _cmd_ping(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        return {'success': True, 'state': self._state.name}

    def _cmd_refresh_templates(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        try:
            self._load_templates()
            return {'success': True, 'template_count': len(self._template_cache)}
        except Exception as exc:
            return {'success': False, 'error': str(exc)}

    def _cmd_attendance_start(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        self._attendance_active = True
        self._attendance_mode = payload.get('mode', 'entrada')
        self._emit_event(HardwareEvent(HardwareEventType.ATTENDANCE_STATUS, {
            'attendance_active': True,
            'attendance_mode': self._attendance_mode,
        }))
        return {'success': True, 'attendance_active': True, 'attendance_mode': self._attendance_mode}

    def _cmd_attendance_stop(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        self._attendance_active = False
        self._emit_event(HardwareEvent(HardwareEventType.ATTENDANCE_STATUS, {
            'attendance_active': False,
            'attendance_mode': self._attendance_mode,
        }))
        return {'success': True, 'attendance_active': False}

    def _cmd_enroll(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        timeout = float(payload.get('timeout', 30.0))
        self._ensure_ready()
        template = self._capture_enroll_template(timeout=timeout)
        if template is None:
            return {'success': False, 'error': 'No se obtuvo huella para enroll'}
        template_base64 = base64.b64encode(template).decode('utf-8')
        self._emit_event(HardwareEvent(HardwareEventType.ENROLL_COMPLETE, {'template': template_base64}))
        self.enqueue_command(HardwareCommand(HardwareCommandType.REFRESH_TEMPLATES))
        return {'success': True, 'template': template_base64}

    def _cmd_identify(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        self._ensure_ready()
        template = self._capture_single_template(timeout=20.0)
        if template is None:
            return {'success': False, 'error': 'No se detectó huella'}
        result = self._match_template(template)
        self._emit_event(HardwareEvent(HardwareEventType.IDENTIFY_COMPLETE, result))
        return result

    def _ensure_ready(self) -> None:
        if self._state == HardwareState.READY and self._sdk is not None:
            return
        self._connect_hardware(force=True)
        if self._state != HardwareState.READY:
            raise RuntimeError('Hardware no está listo: %s' % self._state.name)

    def _connect_hardware(self, force: bool = False) -> None:
        now = time.time()
        if self._state in (HardwareState.CONNECTING, HardwareState.READY) and not force:
            return
        if now - self._last_connect_attempt < self.RECONNECT_INTERVAL and self._state != HardwareState.DISCONNECTED:
            return
        self._last_connect_attempt = now
        self._emit_state(HardwareState.CONNECTING)
        try:
            self._sdk = ZKFP2()
            self._emit_state(HardwareState.READY)
            logging.info('[HARDWARE] Sensor inicializado y listo.')
            self._load_templates()
        except Exception as exc:
            self._sdk = None
            self._emit_state(HardwareState.RECOVERING)
            self._emit_error('Fallo al conectar hardware', exc)
            time.sleep(self.RECONNECT_INTERVAL)

    def _load_templates(self) -> None:
        self._template_cache.clear()
        if self._firestore is None:
            raise RuntimeError('Firestore no está inicializado')
        students = self._firestore.collection(self.FIRESTORE_COLLECTION_STUDENTS).stream()
        for student_doc in students:
            data = student_doc.to_dict() or {}
            encoded = data.get('fingerprintTemplate')
            if not encoded:
                continue
            try:
                template_bytes = base64.b64decode(encoded)
                self._template_cache[student_doc.id] = {
                    'name': data.get('nombre', 'Alumno'),
                    'template_bytes': template_bytes,
                }
            except Exception as exc:
                logging.warning('[TEMPLATE] Error decodificando plantilla de %s: %s', student_doc.id, exc)
        self._emit_event(HardwareEvent(HardwareEventType.TEMPLATE_REFRESHED, {'count': len(self._template_cache)}))
        logging.info('[TEMPLATE] %s plantillas cargadas en caché.', len(self._template_cache))

    def _capture_single_template(self, timeout: float = 20.0) -> Optional[bytes]:
        deadline = time.time() + timeout
        while time.time() < deadline:
            fingerprint = self._acquire_fingerprint()
            if fingerprint:
                return self._normalize_fingerprint(fingerprint)
            time.sleep(self.ATTENDANCE_POLL_INTERVAL)
        return None

    def _capture_enroll_template(self, timeout: float = 30.0) -> Optional[bytes]:
        templates: List[bytes] = []
        deadline = time.time() + timeout
        while len(templates) < 3 and time.time() < deadline:
            fingerprint = self._acquire_fingerprint()
            if fingerprint:
                templates.append(self._normalize_fingerprint(fingerprint))
                logging.info('[ENROLL] Captura %s/3 completada.', len(templates))
                time.sleep(0.5)
            else:
                time.sleep(self.ATTENDANCE_POLL_INTERVAL)
        if len(templates) < 3:
            return None
        merged = self._sdk.DBMerge(templates[0], templates[1], templates[2])
        return self._normalize_fingerprint(merged)

    def _normalize_fingerprint(self, fingerprint: Any) -> bytes:
        if isinstance(fingerprint, (tuple, list)) and fingerprint:
            fingerprint = fingerprint[0]
        if isinstance(fingerprint, (bytes, bytearray)):
            return bytes(fingerprint)
        if Array is not None and Byte is not None and 'System.Byte[]' in str(type(fingerprint)):
            return bytes(fingerprint)
        raise RuntimeError('Formato de huella no soportado: %s' % type(fingerprint))

    def _acquire_fingerprint(self) -> Optional[Any]:
        if self._sdk is None:
            self._connect_hardware()
            return None
        try:
            fingerprint = self._sdk.AcquireFingerprint()
            if fingerprint:
                logging.debug('[HARDWARE] Huella capturada.')
            return fingerprint
        except Exception as exc:
            if 'DeviceNotInitializedError' in type(exc).__name__:
                self._emit_error('DeviceNotInitializedError durante captura', exc)
                self._reset_hardware()
            else:
                self._emit_error('Error de captura de huella', exc)
            return None

    def _reset_hardware(self) -> None:
        self._sdk = None
        self._emit_state(HardwareState.RECOVERING)
        time.sleep(self.RECONNECT_INTERVAL)
        self._connect_hardware(force=True)

    def _match_template(self, template: bytes) -> Dict[str, Any]:
        if self._sdk is None:
            return {'success': False, 'error': 'Hardware no listo'}
        if not self._template_cache:
            return {'success': False, 'error': 'No hay plantillas cargadas'}
        try:
            query_template = Array[Byte](template)
        except Exception as exc:
            return {'success': False, 'error': f'Error convirtiendo plantilla: {exc}'}

        best_match: Optional[Dict[str, Any]] = None
        for student_id, info in self._template_cache.items():
            try:
                candidate = Array[Byte](info['template_bytes'])
                score = None
                if hasattr(self._sdk, 'Verify'):
                    score = self._sdk.Verify(query_template, candidate)
                elif hasattr(self._sdk, 'MatchTemplate'):
                    score = self._sdk.MatchTemplate(query_template, candidate)
                if score is None:
                    continue
                if score >= self.IDENTIFICATION_THRESHOLD:
                    if best_match is None or score > best_match['score']:
                        best_match = {
                            'studentId': student_id,
                            'studentName': info['name'],
                            'score': score,
                        }
            except Exception as exc:
                logging.debug('[MATCH] Error comparando contra %s: %s', student_id, exc)
                continue

        if best_match:
            return {'success': True, 'matched': best_match}
        return {'success': False, 'error': 'No se encontró coincidencia'}

    def _process_attendance_cycle(self) -> None:
        if self._state != HardwareState.READY:
            self._connect_hardware()
            return

        template = self._capture_single_template(timeout=self.ATTENDANCE_POLL_INTERVAL)
        if template is None:
            return

        identification = self._match_template(template)
        if not identification.get('success'):
            self._emit_event(HardwareEvent(HardwareEventType.ATTENDANCE_DETECTED, {
                'success': False,
                'error': 'Huella capturada pero no identificada',
            }))
            return

        student_id = identification['matched']['studentId']
        student_name = identification['matched']['studentName']
        attendance_result = self._register_attendance(student_id, student_name)
        self._emit_event(HardwareEvent(HardwareEventType.ATTENDANCE_DETECTED, attendance_result))

    def _register_attendance(self, student_id: str, student_name: str) -> Dict[str, Any]:
        if self._firestore is None:
            return {'success': False, 'error': 'Firestore no disponible'}

        now = time.time()
        today = time.strftime('%Y-%m-%d')
        try:
            attendance_ref = self._firestore.collection(self.FIRESTORE_COLLECTION_ATTENDANCE)
            existing = list(
                attendance_ref
                .where('studentId', '==', student_id)
                .where('date', '==', today)
                .stream()
            )
            if not existing:
                entry_type = 'entrada'
            else:
                record = existing[0].to_dict() or {}
                if record.get('type') == 'entrada' and not record.get('salida'):
                    entry_type = 'salida'
                else:
                    entry_type = 'permiso'

            document = {
                'studentId': student_id,
                'studentName': student_name,
                'date': today,
                'timestamp': firestore.SERVER_TIMESTAMP,
                'type': entry_type,
            }
            attendance_ref.document().set(document)
            logging.info('[ATTENDANCE] %s registrado para %s (%s)', entry_type, student_id, student_name)
            return {
                'success': True,
                'studentId': student_id,
                'studentName': student_name,
                'type': entry_type,
                'timestamp': now,
            }
        except Exception as exc:
            self._emit_error('Error registrando asistencia', exc)
            return {'success': False, 'error': str(exc)}
