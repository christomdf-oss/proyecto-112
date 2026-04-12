'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable } from './data-table';
import { getColumns } from './columns';
import type { WhatsappQueueItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import {
  doc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function WhatsappQueuePage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [pendingItems, setPendingItems] = React.useState<WhatsappQueueItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Fetch data manually instead of using a real-time listener
  React.useEffect(() => {
    if (!firestore) return;

    const fetchQueue = async () => {
      setLoading(true);
      try {
        // Simplified query without orderBy to avoid needing a composite index
        const q = query(
          collection(firestore, 'whatsapp_queue'),
          where('status', '==', 'pendiente')
        );
        const querySnapshot = await getDocs(q);
        const items = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          // Convert timestamps
          for (const key in data) {
            if (data[key] && typeof data[key].toDate === 'function') {
              data[key] = data[key].toDate();
            }
          }
          return { id: doc.id, ...data } as WhatsappQueueItem;
        });

        // Sort items on the client-side by timestamp, ascending
        items.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

        setPendingItems(items);
      } catch (error: any) {
        console.error('Error fetching whatsapp queue:', error);
        toast({
          variant: 'destructive',
          title: 'Error al cargar mensajes',
          description: `No se pudo obtener la cola de mensajes: ${error.message}`,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchQueue();
  }, [firestore, toast]);

  const handleSend = async (item: WhatsappQueueItem) => {
    const cleanedPhone = item.tutorPhone.replace(/[\s-()]/g, '');
    const message = `COBACAM P10: El alumno ${
      item.studentName
    } registró su ${item.eventType} a las ${format(item.timestamp, 'p', {
      locale: es,
    })}.`;
    const url = `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(
      message
    )}`;

    window.open(url, '_blank');

    if (firestore) {
      try {
        const itemRef = doc(firestore, 'whatsapp_queue', item.id);
        await updateDoc(itemRef, { status: 'enviado' });

        // Update local state to remove the item from the list instantly
        setPendingItems((prevItems) => prevItems.filter((i) => i.id !== item.id));

        toast({
          title: 'Marcado como enviado',
          description: `El mensaje para ${item.studentName} se ha marcado como enviado.`,
        });
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Error al actualizar',
          description: `No se pudo marcar como enviado: ${error.message}`,
        });
      }
    }
  };

  const columns = getColumns({ onSend: handleSend });

  return (
    <div className="container mx-auto py-2">
      <PageHeader
        title="Cola de Notificaciones WhatsApp"
        description="Mensajes pendientes de enviar a los tutores."
      />
      <Card>
        <CardContent className="pt-6">
          <DataTable
            columns={columns}
            data={pendingItems}
            isLoading={loading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
