'use client';

import * as React from 'react';
import { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { Attendance, Student } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface DailyAttendanceListProps {
  date: Date;
  attendance: Attendance[];
  students: Student[];
}

type ProcessedAttendance = {
  studentId: string;
  studentName: string;
  grupo: string;
  entrada: Date | null;
  salida: Date | null;
};

export default function DailyAttendanceList({ date, attendance, students }: DailyAttendanceListProps) {
  const processedAttendance = React.useMemo(() => {
    const studentsById = new Map(students.map(s => [s.id, s]));
    const attendanceByStudent = new Map<string, { entrada: Date | null, salida: Date | null }>();

    for (const item of attendance) {
        if (!attendanceByStudent.has(item.studentId)) {
            attendanceByStudent.set(item.studentId, { entrada: null, salida: null });
        }
        const studentRecords = attendanceByStudent.get(item.studentId)!;

        if (item.type === 'entrada') {
            if (!studentRecords.entrada || item.timestamp < studentRecords.entrada) {
                studentRecords.entrada = item.timestamp;
            }
        } else if (item.type === 'salida') {
            if (!studentRecords.salida || item.timestamp > studentRecords.salida) {
                studentRecords.salida = item.timestamp;
            }
        }
    }

    const result: ProcessedAttendance[] = [];
    for (const [studentId, times] of attendanceByStudent.entries()) {
        const student = studentsById.get(studentId);
        if (student) {
            result.push({
                studentId,
                studentName: student.nombre,
                grupo: student.grupo,
                entrada: times.entrada,
                salida: times.salida,
            });
        }
    }
    
    result.sort((a, b) => a.studentName.localeCompare(b.studentName));

    return result;
  }, [attendance, students]);

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
                    <p className="text-sm font-medium leading-none">{item.studentName}</p>
                    <p className="text-xs text-muted-foreground">Grupo {item.grupo}</p>
                  </div>
                  <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                    {item.entrada ? (
                      <div className="flex items-center gap-2">
                        <span className="flex h-2 w-2 rounded-full bg-success" />
                        <span>Entrada: <strong>{format(item.entrada, 'p', { locale: es })}</strong></span>
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
                        <span>Salida: <strong>{format(item.salida, 'p', { locale: es })}</strong></span>
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
