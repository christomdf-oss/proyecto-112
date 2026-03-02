'use client';
import * as React from 'react';
import type { Student, Attendance } from '@/lib/types';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format, startOfMonth, endOfMonth, isWithinInterval, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface StudentReportCardProps {
    student: Student;
    attendance: Attendance[];
    onBack: () => void;
}

export function StudentReportCard({ student, attendance, onBack }: StudentReportCardProps) {
    const [currentMonth, setCurrentMonth] = React.useState(new Date());

    const studentAttendanceForMonth = React.useMemo(() => {
        const interval = { start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) };
        return attendance
            .filter(a => a.studentId === student.id && isWithinInterval(a.timestamp, interval))
            .sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime());
    }, [student.id, attendance, currentMonth]);

    const attendanceByDay = React.useMemo(() => {
        const days = new Map<string, { entrada: Date | null, salida: Date | null }>();
        studentAttendanceForMonth.forEach(record => {
            const dayString = record.timestamp.toDateString();
            if (!days.has(dayString)) {
                days.set(dayString, { entrada: null, salida: null });
            }
            const dayRecord = days.get(dayString)!;
            if (record.type === 'entrada') {
                if (!dayRecord.entrada || record.timestamp < dayRecord.entrada) {
                  dayRecord.entrada = record.timestamp;
                }
            }
            if (record.type === 'salida') {
                if (!dayRecord.salida || record.timestamp > dayRecord.salida) {
                  dayRecord.salida = record.timestamp;
                }
            }
        });
        return Array.from(days.entries()).map(([dayString, times]) => ({
            date: new Date(dayString),
            ...times
        })).sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [studentAttendanceForMonth]);

    return (
        <div className="container mx-auto py-2">
            <PageHeader title={`Reporte de ${student.nombre}`} description={`Grupo: ${student.grupo} | ID: ${student.id}`}>
                <Button variant="outline" onClick={onBack}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Nueva Búsqueda
                </Button>
            </PageHeader>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex gap-2 items-center">
                      <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                          <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <CardTitle className="capitalize text-xl">
                          {format(currentMonth, 'MMMM yyyy', { locale: es })}
                      </CardTitle>
                      <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                          <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                </CardHeader>
                <CardContent>
                     {attendanceByDay.length > 0 ? (
                        <div className="space-y-3">
                            <div className="grid grid-cols-3 gap-4 font-semibold text-muted-foreground p-2 text-sm">
                                <div>Fecha</div>
                                <div>Entrada</div>
                                <div>Salida</div>
                            </div>
                            {attendanceByDay.map(item => (
                                 <div key={item.date.toString()} className="grid grid-cols-3 gap-4 items-center p-3 rounded-md border text-sm">
                                    <div className="font-medium capitalize">
                                        {format(item.date, "eeee dd", { locale: es })}
                                    </div>
                                     <div className="flex items-center gap-2">
                                         {item.entrada ? (
                                             <>
                                                <span className="flex h-2 w-2 rounded-full bg-success" />
                                                <span className="font-semibold">{format(item.entrada, 'p', { locale: es })}</span>
                                             </>
                                         ) : (
                                             <span className="text-muted-foreground">-</span>
                                         )}
                                     </div>
                                     <div className="flex items-center gap-2">
                                         {item.salida ? (
                                              <>
                                                <span className="flex h-2 w-2 rounded-full bg-destructive" />
                                                <span className="font-semibold">{format(item.salida, 'p', { locale: es })}</span>
                                              </>
                                         ) : (
                                            <span className="text-muted-foreground">-</span>
                                         )}
                                     </div>
                                 </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground py-10">
                            <p>No se encontraron registros de asistencia para este mes.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
