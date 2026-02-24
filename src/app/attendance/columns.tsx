'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { Attendance } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const columns: ColumnDef<Attendance>[] = [
  {
    accessorKey: 'studentName',
    header: 'Nombre del Alumno',
  },
  {
    accessorKey: 'timestamp',
    header: 'Marca de Tiempo',
    cell: ({ row }) => {
      return (
        <div className="flex flex-col">
          <span className="font-medium">
            {format(row.original.timestamp, 'PPpp', { locale: es })}
          </span>
          <span className="text-xs text-muted-foreground">
            {format(row.original.timestamp, 'eeee', { locale: es })}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: 'type',
    header: 'Tipo',
    cell: ({ row }) => {
      const type = row.original.type;
      return (
        <Badge
          variant={type === 'entrada' ? 'success' : 'destructive'}
          className="capitalize"
        >
          {type}
        </Badge>
      );
    },
  },
];
