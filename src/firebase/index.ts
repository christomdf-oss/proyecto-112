import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

// Provides a memoized Firebase app instance.
let firebaseApp: FirebaseApp;
export const initializeFirebase = (): { app: FirebaseApp; auth: Auth; firestore: Firestore } => {
  if (firebaseApp) {
    const app = getApp();
    return { app, auth: getAuth(app), firestore: getFirestore(app) };
  }

  if (getApps().length === 0) {
    firebaseApp = initializeApp(firebaseConfig);
  } else {
    firebaseApp = getApp();
  }

  const auth = getAuth(firebaseApp);
  const firestore = getFirestore(firebaseApp);

  return { app: firebaseApp, auth, firestore };
};


export { FirebaseProvider, useFirebaseApp, useAuth, useFirestore, getFirebase } from './provider';
export { FirebaseClientProvider } from './client-provider';
export { useUser } from './auth/use-user';
export { useDoc } from './firestore/use-doc';
export { useCollection } from './firestore/use-collection';
