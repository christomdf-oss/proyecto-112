#!/usr/bin/env python3
"""
test_sensor.py - Prueba simple de inicialización del sensor ZK9500.
Detecta si el sensor está disponible y captura una huella de prueba.
"""

import time
import logging
import sys

logging.basicConfig(level=logging.INFO, format='[%(levelname)s] %(message)s')

try:
    from pyzkfp import ZKFP2
    logging.info('Importación de ZKFP2 exitosa.')
except ImportError as e:
    logging.error('No se pudo importar ZKFP2: %s', e)
    sys.exit(1)

try:
    import clr
    from System import Array, Byte
    logging.info('Importación de System.Array/Byte exitosa.')
except ImportError as e:
    logging.warning('No se pudo importar System (pythonnet): %s. Continuando sin soporte .NET', e)
    Array = None
    Byte = None


def test_sensor_basic():
    """Intenta inicializar el sensor y capturar una huella."""
    try:
        logging.info('Inicializando sensor ZK9500...')
        zkfp = ZKFP2()
        logging.info('✓ Sensor inicializado correctamente.')
        
        logging.info('Esperando huella... (presiona tu dedo en el sensor)')
        start_time = time.time()
        timeout = 15.0
        
        while time.time() - start_time < timeout:
            try:
                fingerprint = zkfp.AcquireFingerprint()
                if fingerprint:
                    logging.info('✓ HUELLA DETECTADA')
                    logging.info('Tipo de huella: %s', type(fingerprint))
                    
                    if isinstance(fingerprint, (tuple, list)) and fingerprint:
                        template = fingerprint[0]
                        logging.info('Template (primero de tupla): %s', type(template))
                    else:
                        template = fingerprint
                        logging.info('Template directo: %s', type(template))
                    
                    if isinstance(template, (bytes, bytearray)):
                        logging.info('✓ Template es bytes/bytearray con %d bytes', len(template))
                    elif 'System.Byte[]' in str(type(template)):
                        logging.info('✓ Template es System.Byte[] con %d bytes', len(template))
                    else:
                        logging.info('Template tipo: %s', type(template))
                    
                    return True
            except Exception as e:
                if 'DeviceNotInitializedError' in type(e).__name__:
                    logging.error('✗ DeviceNotInitializedError: %s', e)
                    return False
                logging.debug('Sin huella detectada aún: %s', e)
            
            time.sleep(0.3)
        
        logging.warning('✗ Timeout: no se detectó huella en %s segundos', timeout)
        return False
        
    except Exception as e:
        logging.error('✗ Error durante prueba de sensor: %s', e)
        logging.exception(e)
        return False


if __name__ == '__main__':
    logging.info('=== Prueba de Sensor ZK9500 ===')
    success = test_sensor_basic()
    
    if success:
        logging.info('✓ Prueba exitosa: Sensor funciona correctamente')
        sys.exit(0)
    else:
        logging.error('✗ Prueba fallida: Verifica conexión del sensor')
        sys.exit(1)
