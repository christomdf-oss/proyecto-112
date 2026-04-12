'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { WhatsappQueueItem } from '@/lib/types';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertCircle } from 'lucide-react';

export const getColumns = (): ColumnDef<WhatsappQueueItem>[] => [
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => {
      const { status, error } = row.original;
      let variant: 'success' | 'destructive' | 'secondary' | 'default' = 'secondary';
      if (status === 'enviado') variant = 'success';
      if (status === 'error') variant = 'destructive';

      return (
        <div className='flex items-center gap-2'>
          <Badge variant={variant} className="capitalize">{status}</Badge>
          {status === 'error' && error && (
             <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <AlertCircle className="h-4 w-4 text-destructive" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{error}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'studentName',
    header: 'Alumno',
  },
  {
    accessorKey: 'tutorPhone',
    header: 'Teléfono del Tutor',
  },
  {
    accessorKey: 'eventType',
    header: 'Evento',
     cell: ({ row }) => {
      const type = row.original.eventType;
      return <span className="capitalize">{type} @ {format(row.original.timestamp, 'p', { locale: es })}</span>;
    },
  },
  {
    accessorKey: 'sentAt',
    header: 'Procesado',
    cell: ({ row }) => {
        const { sentAt, status } = row.original;
        if (status === 'pendiente' || !sentAt) return <span className="text-muted-foreground">-</span>
        return formatDistanceToNow(sentAt, { addSuffix: true, locale: es });
    }
  },
];
