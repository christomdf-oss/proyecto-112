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
    filterFn: (row, columnId, filterValue) => {
      const date = row.getValue(columnId) as Date;
      const [start, end] = filterValue as [Date | undefined, Date | undefined];

      if (!start || !end) {
        return true;
      }

      const startDate = new Date(start);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(end);
      endDate.setHours(23, 59, 59, 999);

      return date >= startDate && date <= endDate;
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
