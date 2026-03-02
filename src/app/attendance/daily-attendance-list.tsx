'use client';

import * as React from 'react';
import {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { ProcessedAttendance } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface DailyAttendanceListProps {
  date: Date;
  processedAttendance: ProcessedAttendance[];
}

export default function DailyAttendanceList({
  date,
  processedAttendance,
}: DailyAttendanceListProps) {
  return (
    <>
      <CardHeader>
        <CardTitle className="capitalize">
          {format(date, "eeee, d 'de' MMMM", { locale: es })}
        </CardTitle>
        <CardDescription>
          {processedAttendance.length} alumno(s) con registros.
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[430px] overflow-y-auto">
        {processedAttendance.length > 0 ? (
          <div className="space-y-6">
            {processedAttendance.map((item) => (
              <div key={item.studentId} className="flex items-start gap-4">
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
                    <p className="text-xs text-muted-foreground">
                      Grupo {item.grupo}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                    {item.entrada ? (
                      <div className="flex items-center gap-2">
                        <span className="flex h-2 w-2 rounded-full bg-success" />
                        <span>
                          Entrada:{' '}
                          <strong>
                            {format(item.entrada, 'p', { locale: es })}
                          </strong>
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="flex h-2 w-2 rounded-full bg-muted" />
                        <span>Sin registro de entrada</span>
                      </div>
                    )}
                    {item.salida ? (
                      <div className="flex items-center gap-2">
                        <span className="flex h-2 w-2 rounded-full bg-destructive" />
                        <span>
                          Salida:{' '}
                          <strong>
                            {format(item.salida, 'p', { locale: es })}
                          </strong>
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="flex h-2 w-2 rounded-full bg-muted" />
                        <span>Sin registro de salida</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-center text-muted-foreground">
            <p>No hay registros de asistencia para esta fecha.</p>
          </div>
        )}
      </CardContent>
    </>
  );
}
