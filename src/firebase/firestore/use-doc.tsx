'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  doc,
  onSnapshot,
  DocumentReference,
  DocumentData,
  DocumentSnapshot,
} from 'firebase/firestore';
import { useFirestore } from '../provider';

interface UseDocOptions<T> {
  snapshotListenOptions?: {
    includeMetadataChanges: boolean;
  };
  initialValue?: T;
}

export function useDoc<T>(
  docPath: string | null | undefined,
  options?: UseDocOptions<T>
) {
  const firestore = useFirestore();
  const [data, setData] = useState<T | undefined>(options?.initialValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const docRef = useMemo(
    () =>
      firestore && docPath ? (doc(firestore, docPath) as DocumentReference<T>) : null,
    [firestore, docPath]
  );

  useEffect(() => {
    if (!docRef) {
      setData(undefined);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = onSnapshot(
      docRef,
      options?.snapshotListenOptions,
      (snapshot: DocumentSnapshot<DocumentData>) => {
        if (snapshot.exists()) {
          const docData = { id: snapshot.id, ...snapshot.data() } as unknown as T;
          setData(docData);
        } else {
          setData(undefined);
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error(err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [docRef, options?.snapshotListenOptions]);

  return { data, loading, error };
}
