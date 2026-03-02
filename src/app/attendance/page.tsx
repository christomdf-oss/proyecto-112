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
    let dateForFilename: string;

    if (exportType === 'day') {
      const dataToExport = processedAttendance;
      dateForFilename = format(selectedDate, 'yyyy-MM-dd');

      if (dataToExport.length === 0) {
        toast({
          variant: 'destructive',
          title: 'No hay datos para exportar',
          description: 'No se encontraron registros para el día seleccionado.',
        });
        return;
      }

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
        const json_data = groupData.map(item => ({
          'Alumno': item.studentName,
          'Entrada': item.entrada ? format(item.entrada, 'p', { locale: es }) : 'Sin registro',
          'Salida': item.salida ? format(item.salida, 'p', { locale: es }) : 'Sin registro',
        }));

        const ws = XLSX.utils.json_to_sheet(json_data);
        XLSX.utils.book_append_sheet(wb, ws, `Grupo ${group}`);
      });

      XLSX.writeFile(wb, `asistencia_diaria_${dateForFilename}.xlsx`);
    } else { // 'month' export
      const monthStart = startOfMonth(selectedDate);
      const monthEnd = endOfMonth(selectedDate);
      dateForFilename = format(monthStart, 'yyyy-MM');

      const attendanceForMonth = attendanceData.filter(
        (a) => a.timestamp >= monthStart && a.timestamp <= monthEnd
      );

      if (attendanceForMonth.length === 0) {
        toast({
          variant: 'destructive',
          title: 'No hay datos para exportar',
          description: `No se encontraron registros para el mes seleccionado.`,
        });
        return;
      }

      const wb = XLSX.utils.book_new();

      // --- START: Summary Sheet Logic ---
      const schoolDaysInMonth = new Set(attendanceForMonth.map(a => a.timestamp.toDateString()));
      const totalSchoolDays = schoolDaysInMonth.size;

      const studentSummaryData = students.map(student => {
        const studentAttendanceInMonth = attendanceForMonth.filter(a => a.studentId === student.id);
        const attendedDays = new Set(studentAttendanceInMonth.filter(a => a.type === 'entrada').map(a => a.timestamp.toDateString()));
        
        let lateEntries = 0;
        const lateEntryThresholdMinutes = 15; // After 8:15 AM is late
        
        studentAttendanceInMonth.forEach(a => {
            if (a.type === 'entrada') {
                if (a.timestamp.getHours() > 8 || (a.timestamp.getHours() === 8 && a.timestamp.getMinutes() > lateEntryThresholdMinutes)) {
                    lateEntries++;
                }
            }
        });

        const daysAttended = attendedDays.size;
        const absences = totalSchoolDays - daysAttended;
        const attendancePercentage = totalSchoolDays > 0 ? (daysAttended / totalSchoolDays) * 100 : 0;

        return {
            'Alumno': student.nombre,
            'Grupo': student.grupo,
            'Días Asistidos': daysAttended,
            'Ausencias': absences,
            '% Asistencia': attendancePercentage, // Kept as number for calculations
            'Entradas Tardías': lateEntries,
        };
      });
      
      const groupAvgAttendance: Record<string, { total: number, count: number }> = {};
      studentSummaryData.forEach(s => {
          if (!groupAvgAttendance[s.Grupo]) {
              groupAvgAttendance[s.Grupo] = { total: 0, count: 0 };
          }
          groupAvgAttendance[s.Grupo].total += s['% Asistencia'];
          groupAvgAttendance[s.Grupo].count++;
      });
  
      const groupSummaryJson = Object.keys(groupAvgAttendance).sort().map(group => ({
          'Grupo': group,
          '% Asistencia Promedio': `${(groupAvgAttendance[group].total / groupAvgAttendance[group].count).toFixed(1)}%`
      }));

      const studentSummaryJson = studentSummaryData.map(s => ({
          ...s,
          '% Asistencia': `${s['% Asistencia'].toFixed(1)}%`,
          'Requiere Atención': s['% Asistencia'] < 80 ? 'Sí' : 'No'
      })).sort((a,b) => a.Grupo.localeCompare(b.Grupo) || a.Alumno.localeCompare(b.Alumno));

      const summaryWs = XLSX.utils.json_to_sheet(studentSummaryJson);
      XLSX.utils.sheet_add_json(summaryWs, [{}], { origin: -1 }); 
      XLSX.utils.sheet_add_json(summaryWs, [{ 'Resumen por Grupo': '' }], { origin: -1, skipHeader: true });
      XLSX.utils.sheet_add_json(summaryWs, groupSummaryJson, { origin: -1 });

      XLSX.utils.book_append_sheet(wb, summaryWs, 'Resumen Mensual');

      // --- END: Summary Sheet Logic ---

      // --- START: Detailed Sheets Logic ---
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
      const dataToExport = flatMonthData.sort((a,b) => a.date.getTime() - b.date.getTime() || a.studentName.localeCompare(b.studentName));
    
      const groupedByGrupo = dataToExport.reduce((acc, item) => {
        const group = item.grupo;
        if (!acc[group]) {
          acc[group] = [];
        }
        acc[group].push(item);
        return acc;
      }, {} as Record<string, typeof dataToExport>);

      Object.keys(groupedByGrupo).sort().forEach(group => {
        const groupData = groupedByGrupo[group];
        const json_data = groupData.map(item => ({
          'Fecha': item.date ? format(item.date, 'eeee dd, MMMM', { locale: es }) : '',
          'Alumno': item.studentName,
          'Entrada': item.entrada ? format(item.entrada, 'p', { locale: es }) : 'Sin registro',
          'Salida': item.salida ? format(item.salida, 'p', { locale: es }) : 'Sin registro',
        }));
        
        const ws = XLSX.utils.json_to_sheet(json_data);
        XLSX.utils.book_append_sheet(wb, ws, `Grupo ${group}`);
      });
      // --- END: Detailed Sheets Logic ---

      XLSX.writeFile(wb, `reporte_mensual_asistencia_${dateForFilename}.xlsx`);
    }
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
