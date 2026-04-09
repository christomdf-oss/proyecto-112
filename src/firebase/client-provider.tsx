'use client';

import { ReactNode } from 'react';
import { FirebaseProvider } from './provider';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  return <FirebaseProvider>{children}</FirebaseProvider>;
}
