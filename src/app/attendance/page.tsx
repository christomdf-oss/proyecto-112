'use client';

import * as React from 'react';
import { getAttendance, getStudents } from '@/lib/data';
import { PageHeader } from '@/components/page-header';
import AttendanceCalendar from './attendance-calendar';
import DailyAttendanceList from './daily-attendance-list';
import { isSameDay, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card } from '@/components/ui/card';
import type { Student, Attendance, ProcessedAttendance } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Download } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

export default function AttendancePage() {
  const attendanceData = React.useMemo(() => getAttendance(), []);
  const students = React.useMemo(() => getStudents(), []);
  const [selectedDate, setSelectedDate] = React.useState(new Date());

  const processedAttendance = React.useMemo(() => {
    const attendanceForSelectedDay = attendanceData.filter((a) =>
      isSameDay(a.timestamp, selectedDate)
    );
    const studentsById = new Map(students.map((s) => [s.id, s]));
    const attendanceByStudent = new Map<
      string,
      { entrada: Date | null; salida: Date | null }
    >();

    for (const item of attendanceForSelectedDay) {
      if (!attendanceByStudent.has(item.studentId)) {
        attendanceByStudent.set(item.studentId, {
          entrada: null,
          salida: null,
        });
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
  }, [attendanceData, students, selectedDate]);

  const daysWithAttendance = React.useMemo(() => {
    return new Set(attendanceData.map((a) => a.timestamp.toDateString()));
  }, [attendanceData]);

  const handleExport = () => {
    if (processedAttendance.length === 0) return;

    const headers = ['Alumno', 'Grupo', 'Entrada', 'Salida'];
    const rows = processedAttendance.map((item) => [
      `"${item.studentName.replace(/"/g, '""')}"`, // Escape quotes
      item.grupo,
      item.entrada
        ? format(item.entrada, 'p', { locale: es })
        : 'Sin registro',
      item.salida
        ? format(item.salida, 'p', { locale: es })
        : 'Sin registro',
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    
    // Add BOM for Excel compatibility
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });

    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    const dateString = format(selectedDate, "yyyy-MM-dd");
    link.setAttribute("download", `asistencia_${dateString}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container mx-auto py-2">
      <PageHeader
        title="Historial de Asistencia"
        description="Selecciona una fecha para ver los registros o exportarlos."
      >
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={'outline'}
                className={cn(
                  'w-[280px] justify-start text-left font-normal',
                  !selectedDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? (
                  format(selectedDate, 'PPP', { locale: es })
                ) : (
                  <span>Selecciona una fecha</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    setSelectedDate(date);
                  }
                }}
                locale={es}
                disabled={(date) =>
                  date > new Date() || date < new Date('2020-01-01')
                }
                initialFocus
                captionLayout="dropdown-buttons"
                fromYear={2020}
                toYear={new Date().getFullYear()}
              />
            </PopoverContent>
          </Popover>
          <Button onClick={handleExport} disabled={processedAttendance.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </PageHeader>
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
          <div className="md:col-span-1 md:border-r">
            <AttendanceCalendar
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              daysWithAttendance={daysWithAttendance}
            />
          </div>
          <div className="md:col-span-2">
            <DailyAttendanceList
              date={selectedDate}
              processedAttendance={processedAttendance}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
