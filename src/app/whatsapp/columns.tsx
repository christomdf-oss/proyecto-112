'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import type { WhatsappQueueItem } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MessageSquare } from 'lucide-react';

interface GetColumnsProps {
  onSend: (item: WhatsappQueueItem) => void;
}

export const getColumns = ({ onSend }: GetColumnsProps): ColumnDef<WhatsappQueueItem>[] => [
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
      return <span className="capitalize">{type}</span>;
    },
  },
  {
    accessorKey: 'timestamp',
    header: 'Hora de Registro',
    cell: ({ row }) => format(row.original.timestamp, 'Pp', { locale: es })
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div className="text-right">
          <Button onClick={() => onSend(item)} size="sm" className="bg-green-600 hover:bg-green-700 text-white">
            <MessageSquare className="mr-2 h-4 w-4" />
            Enviar WhatsApp
          </Button>
        </div>
      );
    },
  },
];
