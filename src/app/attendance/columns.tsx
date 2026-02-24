'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { Attendance } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export const columns: ColumnDef<Attendance>[] = [
  {
    accessorKey: 'studentName',
    header: 'Student Name',
  },
  {
    accessorKey: 'timestamp',
    header: 'Timestamp',
    cell: ({ row }) => {
      return (
        <div className="flex flex-col">
          <span className="font-medium">
            {format(row.original.timestamp, 'PPpp')}
          </span>
          <span className="text-xs text-muted-foreground">
            {format(row.original.timestamp, 'eeee')}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => {
      const type = row.original.type;
      return (
        <Badge
          variant={type === 'entrada' ? 'success' : 'destructive'}
        >
          {type === 'entrada' ? 'Entry' : 'Exit'}
        </Badge>
      );
    },
  },
];
