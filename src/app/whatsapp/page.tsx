'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import StatCard from '@/components/dashboard/stat-card';
import { DataTable } from './data-table';
import { getColumns } from './columns';
import type { WhatsappQueueItem } from '@/lib/types';
import { useCollection } from '@/firebase';
import { MessagesSquare, Send, AlertTriangle } from 'lucide-react';
import { isAfter, subHours } from 'date-fns';

export default function WhatsappStatusPage() {
  // Fetch all items from the last 24 hours for monitoring
  const { data: queueItems, loading } = useCollection<WhatsappQueueItem>('whatsapp_queue');

  const { pendingCount, sentCount, errorCount, recentItems } = React.useMemo(() => {
    if (!queueItems) {
      return { pendingCount: 0, sentCount: 0, errorCount: 0, recentItems: [] };
    }
    const last24Hours = subHours(new Date(), 24);
    
    let pending = 0;
    let sent = 0;
    let errors = 0;

    const recent = queueItems.filter(item => {
        const isRecent = isAfter(item.timestamp, last24Hours);
        if (item.status === 'pendiente') {
            pending++;
        }
        if (isRecent) {
            if(item.status === 'enviado') sent++;
            if(item.status === 'error') errors++;
        }
        return isRecent;
    });

    recent.sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime());

    return { 
        pendingCount: pending, 
        sentCount: sent, 
        errorCount: errors, 
        recentItems: recent.slice(0, 50) // Show last 50 items in the log
    };
  }, [queueItems]);


  const columns = getColumns();

  return (
    <div className="container mx-auto py-2">
      <PageHeader
        title="Estado de Conexión de WhatsApp"
        description="Panel de monitoreo para el servicio de envío de notificaciones."
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
        <StatCard
          title="Mensajes Pendientes"
          value={pendingCount}
          icon={MessagesSquare}
          description="Notificaciones esperando ser procesadas."
        />
        <StatCard
          title="Enviados (24h)"
          value={sentCount}
          icon={Send}
          description="Mensajes enviados exitosamente."
        />
        <StatCard
          title="Errores (24h)"
          value={errorCount}
          icon={AlertTriangle}
          description="Notificaciones que fallaron al enviar."
        />
      </div>
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Registro de Actividad (Últimas 24 horas)</h3>
          <DataTable
            columns={columns}
            data={recentItems}
            isLoading={loading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
