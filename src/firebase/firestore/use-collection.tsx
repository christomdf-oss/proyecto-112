'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  collection,
  query,
  onSnapshot,
  Query,
  DocumentData,
  QuerySnapshot,
} from 'firebase/firestore';
import { useFirestore } from '../provider';

interface UseCollectionOptions<T> {
  snapshotListenOptions?: {
    includeMetadataChanges: boolean;
  };
  initialValue?: T[];
}

export function useCollection<T>(
  collectionPath: string | null | undefined,
  options?: UseCollectionOptions<T>
) {
  const firestore = useFirestore();
  const [data, setData] = useState<T[] | undefined>(options?.initialValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const q = useMemo(
    () =>
      firestore && collectionPath ? (query(collection(firestore, collectionPath)) as Query<T>) : null,
    [firestore, collectionPath]
  );

  useEffect(() => {
    if (!q) {
      setData(undefined);
      setLoading(false);
      return;
    }
    
    setLoading(true);

    const unsubscribe = onSnapshot(
      q,
      options?.snapshotListenOptions,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const docs = snapshot.docs.map(
          (doc) => {
            const data = doc.data();
            // Convert Firestore Timestamps to JS Dates
            for (const key in data) {
              if (data[key] && typeof data[key].toDate === 'function') {
                data[key] = data[key].toDate();
              }
            }
            return { id: doc.id, ...data } as unknown as T;
          }
        );
        setData(docs);
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
  }, [q, options?.snapshotListenOptions]);

  return { data, loading, error };
}
