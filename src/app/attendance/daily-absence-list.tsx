'use client';

import * as React from 'react';
import {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { Student } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Phone } from 'lucide-react';

interface DailyAbsenceListProps {
  date: Date;
  absentStudents: Student[];
}

export default function DailyAbsenceList({
  date,
  absentStudents,
}: DailyAbsenceListProps) {
  return (
    <>
      <CardHeader>
        <CardTitle className="capitalize">
          Alumnos Ausentes
        </CardTitle>
        <CardDescription>
          {absentStudents.length} alumno(s) sin registro de entrada para el {format(date, "d 'de' MMMM", { locale: es })}.
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[430px] overflow-y-auto">
        {absentStudents.length > 0 ? (
          <div className="space-y-6">
            {absentStudents.map((student) => (
              <div key={student.matricula} className="flex items-start gap-4">
                <Avatar className="h-9 w-9 border">
                  <AvatarFallback>
                    {student.nombre
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="grid gap-1.5 w-full">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium leading-none">
                      {student.nombre}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Grupo {student.grupo}
                    </p>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground gap-2 pt-1">
                    <Phone className="h-3 w-3" />
                    <span>Tutor: {student.telefono_tutor}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-center text-muted-foreground">
            <p>Todos los alumnos registraron asistencia para esta fecha.</p>
          </div>
        )}
      </CardContent>
    </>
  );
}
