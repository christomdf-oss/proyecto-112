'use client';
import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, initializeFirestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

// This function ensures we only initialize once
const getFirebaseServices = () => {
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const firestore = initializeFirestore(app, {
        experimentalForceLongPolling: true,
    });
    return { app, auth, firestore };
};

const firebaseServices = getFirebaseServices();

// Provides a memoized Firebase app instance by exporting the already initialized services.
export const initializeFirebase = (): { app: FirebaseApp; auth: Auth; firestore: Firestore } => {
  return firebaseServices;
};


export { FirebaseProvider, useFirebaseApp, useAuth, useFirestore, getFirebase } from './provider';
export { FirebaseClientProvider } from './client-provider';
export { useUser } from './auth/use-user';
export { useDoc } from './firestore/use-doc';
export { useCollection } from './firestore/use-collection';
