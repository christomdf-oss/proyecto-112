'use client';
import * as React from 'react';
import type { Student, Attendance } from '@/lib/types';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format, startOfMonth, endOfMonth, isWithinInterval, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type * as XLSX from 'xlsx';

interface StudentReportCardProps {
    student: Student;
    attendance: Attendance[];
    onBack: () => void;
}

export function StudentReportCard({ student, attendance, onBack }: StudentReportCardProps) {
    const [currentMonth, setCurrentMonth] = React.useState(new Date());
    const { toast } = useToast();

    const studentAttendanceForMonth = React.useMemo(() => {
        const interval = { start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) };
        return attendance
            .filter(a => a.studentId === student.matricula && isWithinInterval(a.timestamp, interval))
            .sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime());
    }, [student.matricula, attendance, currentMonth]);

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

    const handleExport = async () => {
        const XLSX = await import('xlsx');
        
        const studentAttendance = attendance.filter(a => a.studentId === student.matricula);

        if (studentAttendance.length === 0) {
            toast({
              variant: 'destructive',
              title: 'No hay datos para exportar',
              description: `No se encontraron registros de asistencia para este alumno.`,
            });
            return;
        }

        const attendanceByMonth = studentAttendance.reduce((acc, record) => {
            const monthKey = format(record.timestamp, 'yyyy-MM');
            if (!acc[monthKey]) {
                acc[monthKey] = [];
            }
            acc[monthKey].push(record);
            return acc;
        }, {} as Record<string, Attendance[]>);
        
        const wb = XLSX.utils.book_new();
        const sortedMonths = Object.keys(attendanceByMonth).sort().reverse();

        for (const monthKey of sortedMonths) {
            const monthDate = new Date(monthKey + '-02T00:00:00'); // Use day 2 to avoid timezone issues
            const monthStart = startOfMonth(monthDate);
            const monthEnd = endOfMonth(monthDate);
            const studentAttendanceForThisMonth = attendanceByMonth[monthKey];

            // --- Summary Logic ---
            const allAttendanceForMonth = attendance.filter(a => a.timestamp >= monthStart && a.timestamp <= monthEnd);
            const schoolDaysInMonth = new Set(allAttendanceForMonth.map(a => a.timestamp.toDateString()));
            const totalSchoolDays = schoolDaysInMonth.size;

            const attendedDaysSet = new Set(studentAttendanceForThisMonth.filter(a => a.type === 'entrada').map(a => a.timestamp.toDateString()));
            const daysAttended = attendedDaysSet.size;
            
            let lateEntries = 0;
            const lateEntryThresholdMinutes = 15; // After 8:15 AM is late
            
            studentAttendanceForThisMonth.forEach(a => {
                if (a.type === 'entrada') {
                    if (a.timestamp.getHours() > 8 || (a.timestamp.getHours() === 8 && a.timestamp.getMinutes() > lateEntryThresholdMinutes)) {
                        lateEntries++;
                    }
                }
            });

            const absences = totalSchoolDays > 0 ? totalSchoolDays - daysAttended : 0;
            const attendancePercentage = totalSchoolDays > 0 ? (daysAttended / totalSchoolDays) * 100 : 0;

            const summaryJson = [
                { Key: 'Alumno', Value: student.nombre },
                { Key: 'Grupo', Value: student.grupo },
                { Key: 'Mes del Reporte', Value: format(monthDate, 'MMMM yyyy', { locale: es }) },
                { Key: 'Días Hábiles en el Mes', Value: totalSchoolDays },
                { Key: 'Días Asistidos', Value: daysAttended },
                { Key: 'Ausencias', Value: absences },
                { Key: '% de Asistencia', Value: `${attendancePercentage.toFixed(1)}%` },
                { Key: 'Entradas Tardías', Value: lateEntries },
            ];

            // --- Daily Data Logic ---
            const attendanceByDayForThisMonth = studentAttendanceForThisMonth.reduce((acc, record) => {
                const dayString = record.timestamp.toDateString();
                if (!acc.has(dayString)) {
                    acc.set(dayString, { entrada: null, salida: null });
                }
                const dayRecord = acc.get(dayString)!;
                if (record.type === 'entrada') {
                    if (!dayRecord.entrada || record.timestamp < dayRecord.entrada) dayRecord.entrada = record.timestamp;
                }
                if (record.type === 'salida') {
                    if (!dayRecord.salida || record.timestamp > dayRecord.salida) dayRecord.salida = record.timestamp;
                }
                return acc;
            }, new Map<string, { entrada: Date | null, salida: Date | null }>());
            
            const dailyDataForSheet = Array.from(attendanceByDayForThisMonth.entries()).map(([dayString, times]) => ({
                date: new Date(dayString),
                ...times
            })).sort((a, b) => b.date.getTime() - a.date.getTime());

            const dailyDataJson = dailyDataForSheet.map(item => ({
                'Fecha': format(item.date, "eeee dd, MMMM", { locale: es }),
                'Entrada': item.entrada ? format(item.entrada, 'p', { locale: es }) : 'Sin Registro',
                'Salida': item.salida ? format(item.salida, 'p', { locale: es }) : 'Sin Registro',
            }));
            
            const sheetName = format(monthDate, 'MMM yyyy', { locale: es });
            const ws = XLSX.utils.json_to_sheet(summaryJson, { skipHeader: true });

            ws['!cols'] = [{ wch: 25 }, { wch: 30 }];
            XLSX.utils.sheet_add_json(ws, [{}], { origin: -1 }); 
            XLSX.utils.sheet_add_json(ws, [{ 'Registro Diario de Asistencia': '' }], { origin: -1, skipHeader: true });
            XLSX.utils.sheet_add_json(ws, dailyDataJson, { origin: -1 });

            XLSX.utils.book_append_sheet(wb, ws, sheetName);
        }
        
        const dateForFilename = format(new Date(), 'yyyy-MM-dd');
        XLSX.writeFile(wb, `reporte_completo_${student.nombre.replace(/ /g, '_')}_${dateForFilename}.xlsx`);
        
        toast({
            title: "Reporte Completo Generado",
            description: `El reporte con todos los meses para ${student.nombre} ha sido descargado.`,
        });
    }

    return (
        <div className="container mx-auto py-2">
            <PageHeader title={`Reporte de ${student.nombre}`} description={`Grupo: ${student.grupo} | Matrícula: ${student.matricula}`}>
                <div className="flex gap-2 items-center">
                    <Button onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" />
                        Exportar Reporte Completo
                    </Button>
                    <Button variant="outline" onClick={onBack}>
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Nueva Búsqueda
                    </Button>
                </div>
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
