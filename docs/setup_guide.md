# CampusCheck Setup Guide

This guide provides information on setting up the necessary backend components for the CampusCheck application to function correctly.

## 1. Firestore Security Rules

To secure your Firestore database, ensuring that only your Raspberry Pi can read and write data, you should use the following rules. These rules are a starting point and should be adapted to your specific authentication setup.

Go to your Firebase project -> Firestore Database -> Rules tab, and paste the following:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // The Python `firebase-admin` SDK uses a service account which has admin
    // privileges and bypasses security rules by default. These rules are
    // primarily for restricting access from client-side applications (like this web app).
    // For the web app to function, you would need to implement user authentication
    // and adjust the rules accordingly to allow authenticated users to read data.

    // Allow public read access for demonstration purposes.
    // In a production environment, you should restrict this to authenticated users.
    // e.g. `allow read: if request.auth != null;`
    
    match /alumnos/{alumnoId} {
      allow read: if true;
      // Write access should be locked down to your backend service.
      allow write: if false; 
    }
    
    match /asistencias/{asistenciaId} {
      allow read: if true;
      // Write access should be locked down to your backend service.
      allow write: if false;
    }
  }
}
```

**Important:** The Python `firebase-admin` SDK uses a service account, which by default has **admin privileges** and **bypasses all security rules**. The rules above are therefore most important for preventing unauthorized access from **client-side applications** (like a web browser or mobile app).

## 2. Firebase Credentials for Python Script

For your Python script on the Raspberry Pi to authenticate with Firebase using `firebase-admin`, you need a **service account key file** (`.json`).

Here’s how to get it:

1.  **Go to your Firebase Project Console.**
2.  Click the **gear icon** next to "Project Overview" in the top-left sidebar.
3.  Select **Project settings**.
4.  Go to the **Service accounts** tab.
5.  Click the **"Generate new private key"** button.
6.  A warning will appear. Click **"Generate key"** to confirm.
7.  A `.json` file will be automatically downloaded to your computer.

**How to use it:**

*   **Rename this file** to something simple, like `serviceAccountKey.json`.
*   **Securely copy this file** to your Raspberry Pi. Do NOT commit this file to a public Git repository, as it grants full administrative access to your Firebase project.
*   In your Python script, you will reference the path to this file to initialize the Firebase Admin SDK:

    ```python
    import firebase_admin
    from firebase_admin import credentials

    # Replace "path/to/your/serviceAccountKey.json" with the actual path
    cred = credentials.Certificate("path/to/your/serviceAccountKey.json")
    
    # Replace "<YOUR-PROJECT-ID>" with your actual Firebase project ID
    firebase_admin.initialize_app(cred, {
        'projectId': '<YOUR-PROJECT-ID>',
    })
    ```

This setup allows your Python script to securely connect to and manage your Firebase resources.
