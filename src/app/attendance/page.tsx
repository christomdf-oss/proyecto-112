'use client';

import * as React from 'react';
import { getAttendance, getStudents } from '@/lib/data';
import { PageHeader } from '@/components/page-header';
import AttendanceCalendar from './attendance-calendar';
import DailyAttendanceList from './daily-attendance-list';
import { isSameDay, format, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card } from '@/components/ui/card';
import type { Student, Attendance, ProcessedAttendance } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import type * as XLSX from 'xlsx';

export default function AttendancePage() {
  const attendanceData = React.useMemo(() => getAttendance(), []);
  const students = React.useMemo(() => getStudents(), []);
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const { toast } = useToast();

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

  const handleExport = async (exportType: 'day' | 'month') => {
    const XLSX = await import('xlsx');
    const studentsById = new Map(students.map((s) => [s.id, s]));
    let dataToExport: (ProcessedAttendance & { date?: Date })[] = [];
    let dateForFilename: string;

    if (exportType === 'day') {
      dataToExport = processedAttendance;
      dateForFilename = format(selectedDate, 'yyyy-MM-dd');
    } else {
      const monthStart = startOfMonth(selectedDate);
      const monthEnd = endOfMonth(selectedDate);
      dateForFilename = format(monthStart, 'yyyy-MM');

      const attendanceForMonth = attendanceData.filter(
        (a) => a.timestamp >= monthStart && a.timestamp <= monthEnd
      );

      const monthlyData = new Map<string, Map<string, { entrada: Date | null; salida: Date | null }>>();

      for (const item of attendanceForMonth) {
        const dayString = item.timestamp.toDateString();
        if (!monthlyData.has(dayString)) {
          monthlyData.set(dayString, new Map());
        }
        const dayData = monthlyData.get(dayString)!;

        if (!dayData.has(item.studentId)) {
          dayData.set(item.studentId, { entrada: null, salida: null });
        }
        const studentRecords = dayData.get(item.studentId)!;

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
      
      const flatMonthData: (ProcessedAttendance & { date: Date })[] = [];
      for (const [dayString, dayData] of monthlyData.entries()) {
        for (const [studentId, times] of dayData.entries()) {
          const student = studentsById.get(studentId);
          if (student) {
            flatMonthData.push({
              date: new Date(dayString),
              studentId: student.id,
              studentName: student.nombre,
              grupo: student.grupo,
              ...times,
            });
          }
        }
      }
      dataToExport = flatMonthData.sort((a,b) => a.date.getTime() - b.date.getTime() || a.studentName.localeCompare(b.studentName));
    }
    
    if (dataToExport.length === 0) {
      toast({
        variant: 'destructive',
        title: "No hay datos para exportar",
        description: `No se encontraron registros para el ${exportType === 'day' ? 'día' : 'mes'} seleccionado.`,
      });
      return;
    };

    const groupedByGrupo = dataToExport.reduce((acc, item) => {
      const group = item.grupo;
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(item);
      return acc;
    }, {} as Record<string, typeof dataToExport>);

    const wb = XLSX.utils.book_new();

    Object.keys(groupedByGrupo).sort().forEach(group => {
      const groupData = groupedByGrupo[group];
      let json_data;

      if (exportType === 'day') {
        json_data = groupData.map(item => ({
            'Alumno': item.studentName,
            'Entrada': item.entrada ? format(item.entrada, 'p', { locale: es }) : 'Sin registro',
            'Salida': item.salida ? format(item.salida, 'p', { locale: es }) : 'Sin registro',
        }));
      } else {
        json_data = groupData.map(item => ({
            'Fecha': item.date ? format(item.date, 'eeee dd, MMMM', { locale: es }) : '',
            'Alumno': item.studentName,
            'Entrada': item.entrada ? format(item.entrada, 'p', { locale: es }) : 'Sin registro',
            'Salida': item.salida ? format(item.salida, 'p', { locale: es }) : 'Sin registro',
        }));
      }

      const ws = XLSX.utils.json_to_sheet(json_data);
      XLSX.utils.book_append_sheet(wb, ws, `Grupo ${group}`);
    });

    XLSX.writeFile(wb, `asistencia_${exportType === 'day' ? 'diaria' : 'mensual'}_${dateForFilename}.xlsx`);
  };

  return (
    <div className="container mx-auto py-2">
      <PageHeader
        title="Historial de Asistencia"
        description="Selecciona una fecha en el calendario para ver los registros o exportarlos."
      >
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExport('day')}>
                    Exportar Día
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('month')}>
                    Exportar Mes
                </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
