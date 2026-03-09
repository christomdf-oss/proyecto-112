'use client';

import * as React from 'react';
import {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { Attendance } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';

interface JustifiedListProps {
  date: Date;
  justifiedRecords: Attendance[];
}

type BadgeVariant = 'success' | 'destructive' | 'secondary' | 'outline' | 'default';

const getBadgeProps = (type: Attendance['type']): { variant: BadgeVariant, text: string } => {
    switch (type) {
        case 'entrada':
            return { variant: 'success', text: 'Entrada' };
        case 'salida':
            return { variant: 'destructive', text: 'Salida' };
        case 'justificacion':
            return { variant: 'secondary', text: 'Justificación' };
        case 'permiso':
            return { variant: 'outline', text: 'Permiso' };
        default:
            return { variant: 'default', text: type };
    }
}


export default function JustifiedList({
  date,
  justifiedRecords,
}: JustifiedListProps) {
  return (
    <>
      <CardHeader>
        <CardTitle className="capitalize">
          Registros Manuales
        </CardTitle>
        <CardDescription>
          {justifiedRecords.length} registro(s) manual(es) para el {format(date, "d 'de' MMMM", { locale: es })}.
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[430px] overflow-y-auto">
        {justifiedRecords.length > 0 ? (
          <div className="space-y-6">
            {justifiedRecords.map((item) => {
              const badgeProps = getBadgeProps(item.type);
              return (
                <div key={item.id} className="flex items-start gap-4">
                  <Avatar className="h-9 w-9 border">
                    <AvatarFallback>
                      {item.studentName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid gap-1.5 w-full">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium leading-none">
                        {item.studentName}
                      </p>
                      <Badge variant={badgeProps.variant} className="capitalize">
                        {badgeProps.text}
                        {item.type !== 'justificacion' && ` @ ${format(item.timestamp, 'p', { locale: es })}`}
                      </Badge>
                    </div>
                    <div className="flex items-start text-sm text-muted-foreground gap-2 pt-1">
                      <FileText className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>{item.reason}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-center text-muted-foreground">
            <p>No hay registros manuales o justificaciones para esta fecha.</p>
          </div>
        )}
      </CardContent>
    </>
  );
}
