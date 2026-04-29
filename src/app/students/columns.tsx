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

interface GetColumnsProps {
  onEnroll: (student: Student) => void;
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
  onCopyMatricula: (matricula: string) => void;
}

export const getColumns = ({ onEnroll, onEdit, onDelete, onCopyMatricula }: GetColumnsProps): ColumnDef<Student>[] => [
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
    accessorKey: 'comunidad',
    header: 'Comunidad',
  },
  {
    accessorKey: 'fingerprintTemplate',
    header: 'Huella',
    cell: ({ row }) => {
      const hasTemplate = !!row.getValue('fingerprintTemplate');
      
      return hasTemplate ? (
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
                onClick={() => onCopyMatricula(student.matricula)}
              >
                Copiar Matrícula
              </DropdownMenuItem>
              {!student.fingerprintTemplate && (
                <DropdownMenuItem onClick={() => onEnroll(student)}>
                  Registrar Huella
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEdit(student)}>
                Editar Perfil
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                onClick={() => onDelete(student)}
              >
                Eliminar Perfil
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
