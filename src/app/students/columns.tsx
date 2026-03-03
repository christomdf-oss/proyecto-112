'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Student } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

export const columns: ColumnDef<Student>[] = [
  {
    accessorKey: 'nombre',
    header: 'Nombre',
  },
  {
    accessorKey: 'matricula',
    header: 'Matrícula',
  },
  {
    accessorKey: 'grupo',
    header: 'Grupo',
  },
  {
    accessorKey: 'fingerprintRegistered',
    header: 'Estado Huella',
    cell: ({ row }) => {
      const isRegistered = row.getValue('fingerprintRegistered');
      return isRegistered ? (
        <Badge variant="success">Registrada</Badge>
      ) : (
        <Badge variant="destructive">Pendiente</Badge>
      );
    },
  },
  {
    accessorKey: 'telefono_tutor',
    header: "Teléfono del Tutor",
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const student = row.original;

      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(student.matricula)}
              >
                Copiar Matrícula
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Editar Perfil</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive">Eliminar Perfil</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
