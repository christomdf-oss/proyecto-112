'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable } from './data-table';
import { getColumns } from './columns';
import { useCollection } from '@/firebase';
import type { WhatsappQueueItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function WhatsappQueuePage() {
  const { data: queueItems, loading } = useCollection<WhatsappQueueItem>('whatsapp_queue');
  const firestore = useFirestore();
  const { toast } = useToast();

  const pendingItems = React.useMemo(() => {
    if (!queueItems) return [];
    return queueItems.filter(item => item.status === 'pendiente').sort((a,b) => a.timestamp.getTime() - b.timestamp.getTime());
  }, [queueItems]);

  const handleSend = async (item: WhatsappQueueItem) => {
    const cleanedPhone = item.tutorPhone.replace(/[\s-()]/g, '');
    const message = `COBACAM P10: El alumno ${item.studentName} registró su ${item.eventType} a las ${format(item.timestamp, 'p', { locale: es })}.`;
    const url = `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(message)}`;

    window.open(url, '_blank');

    if (firestore) {
      try {
        const itemRef = doc(firestore, 'whatsapp_queue', item.id);
        await updateDoc(itemRef, { status: 'enviado' });
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
          <DataTable columns={columns} data={pendingItems} isLoading={loading} />
        </CardContent>
      </Card>
    </div>
  );
}
