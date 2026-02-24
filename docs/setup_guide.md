# Guía de Configuración de COBACAM

Esta guía proporciona información sobre cómo configurar los componentes de backend necesarios para que la aplicación COBACAM funcione correctamente.

## 1. Reglas de Seguridad de Firestore

Para proteger tu base de datos de Firestore, asegurando que solo tu Raspberry Pi pueda leer y escribir datos, debes usar las siguientes reglas. Estas reglas son un punto de partida y deben adaptarse a tu configuración de autenticación específica.

Ve a tu proyecto de Firebase -> Firestore Database -> Pestaña de Reglas, y pega lo siguiente:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // El SDK de Python `firebase-admin` utiliza una cuenta de servicio que tiene
    // privilegios de administrador y omite las reglas de seguridad por defecto. Estas reglas son
    // principalmente para restringir el acceso desde aplicaciones del lado del cliente (como esta aplicación web).
    // Para que la aplicación web funcione, necesitarías implementar la autenticación de usuarios
    // y ajustar las reglas en consecuencia para permitir que los usuarios autenticados lean datos.

    // Permitir acceso de lectura público para fines de demostración.
    // En un entorno de producción, deberías restringir esto a usuarios autenticados.
    // ej. `allow read: if request.auth != null;`
    
    match /alumnos/{alumnoId} {
      allow read: if true;
      // El acceso de escritura debe estar restringido a tu servicio de backend.
      allow write: if false; 
    }
    
    match /asistencias/{asistenciaId} {
      allow read: if true;
      // El acceso de escritura debe estar restringido a tu servicio de backend.
      allow write: if false;
    }
  }
}
```

**Importante:** El SDK de Python `firebase-admin` utiliza una cuenta de servicio, que por defecto tiene **privilegios de administrador** y **omite todas las reglas de seguridad**. Por lo tanto, las reglas anteriores son más importantes para prevenir el acceso no autorizado desde **aplicaciones del lado del cliente** (como un navegador web o una aplicación móvil).

## 2. Credenciales de Firebase para el Script de Python

Para que tu script de Python en la Raspberry Pi se autentique con Firebase usando `firebase-admin`, necesitas un **archivo de clave de cuenta de servicio** (`.json`).

Aquí te explicamos cómo obtenerlo:

1.  **Ve a la Consola de tu Proyecto de Firebase.**
2.  Haz clic en el **icono de engranaje** junto a "Descripción general del proyecto" en la barra lateral superior izquierda.
3.  Selecciona **Configuración del proyecto**.
4.  Ve a la pestaña **Cuentas de servicio**.
5.  Haz clic en el botón **"Generar nueva clave privada"**.
6.  Aparecerá una advertencia. Haz clic en **"Generar clave"** para confirmar.
7.  Un archivo `.json` se descargará automáticamente en tu computadora.

**Cómo usarlo:**

*   **Renombra este archivo** a algo simple, como `serviceAccountKey.json`.
*   **Copia de forma segura este archivo** a tu Raspberry Pi. NO confirmes este archivo en un repositorio Git público, ya que otorga acceso administrativo completo a tu proyecto de Firebase.
*   En tu script de Python, harás referencia a la ruta de este archivo para inicializar el SDK de Firebase Admin:

    ```python
    import firebase_admin
    from firebase_admin import credentials

    # Reemplaza "ruta/a/tu/serviceAccountKey.json" con la ruta real
    cred = credentials.Certificate("ruta/a/tu/serviceAccountKey.json")
    
    # Reemplaza "<TU-ID-DE-PROYECTO>" con tu ID de proyecto de Firebase real
    firebase_admin.initialize_app(cred, {
        'projectId': '<TU-ID-DE-PROYECTO>',
    })
    ```

Esta configuración permite que tu script de Python se conecte de forma segura y administre tus recursos de Firebase.
