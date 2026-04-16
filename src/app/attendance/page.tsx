'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import AttendanceCalendar from './attendance-calendar';
import DailyAttendanceList from './daily-attendance-list';
import DailyAbsenceList from './daily-absence-list';
import JustifiedList from './justified-list';
import { isSameDay, format, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { useCollection } from '@/firebase';
import type * as XLSX from 'xlsx';
import { Skeleton } from '@/components/ui/skeleton';


export default function AttendancePage() {
  const { data: attendanceData, loading: attendanceLoading } = useCollection<Attendance>('asistencias');
  const { data: allStudents, loading: studentsLoading } = useCollection<Student>('students');
  const [selectedDate, setSelectedDate] = React.useState<Date>();
  const { toast } = useToast();

  React.useEffect(() => {
    // Set initial date on the client to avoid hydration mismatch
    setSelectedDate(new Date());
  }, []);

  const processedAttendance = React.useMemo(() => {
    if (!attendanceData || !allStudents || !selectedDate) return [];
    // This logic correctly includes manual 'entrada' in the present list.
    const attendanceForSelectedDay = attendanceData.filter((a) =>
      isSameDay(a.timestamp, selectedDate)
    );
    const studentsById = new Map(allStudents.map((s) => [s.matricula, s]));
    const attendanceByStudent = new Map<
      string,
      { entrada: Date | null; salida: Date | null }
    >();

    for (const item of attendanceForSelectedDay) {
      if (!studentsById.has(item.studentId)) continue; // Ignore records for students who are no longer in the system
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
      if (student && times.entrada) { // Only count as present if there's an 'entrada' record.
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
  }, [attendanceData, allStudents, selectedDate]);

  const absentStudents = React.useMemo(() => {
    if (!allStudents || !selectedDate) return [];
    // An absent student is one who does not have an 'entrada' record.
    const presentStudentIds = new Set(processedAttendance.map(a => a.studentId));
    return allStudents.filter(student => student.matricula && !presentStudentIds.has(student.matricula)).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [allStudents, processedAttendance, selectedDate]);

  const justifiedRecords = React.useMemo(() => {
    if (!attendanceData || !selectedDate) return [];
    return attendanceData.filter(
      (a) => a.isManual && isSameDay(a.timestamp, selectedDate)
    ).sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [attendanceData, selectedDate]);

  const daysWithAttendance = React.useMemo(() => {
    if (!attendanceData) return new Set();
    return new Set(attendanceData.map((a) => a.timestamp.toDateString()));
  }, [attendanceData]);

  const handleExport = async (exportType: 'day' | 'month' | 'absent_day') => {
    if (!allStudents || !attendanceData || !selectedDate) {
       toast({
          variant: 'destructive',
          title: 'Datos no cargados',
          description: `Espera a que los datos se carguen antes de exportar.`,
        });
        return;
    }

    const XLSX = await import('xlsx');
    const studentsById = new Map(allStudents.map((s) => [s.matricula, s]));
    let dateForFilename: string;

    if (exportType === 'absent_day') {
      const dataToExport = absentStudents;
      dateForFilename = format(selectedDate, 'yyyy-MM-dd');

      if (dataToExport.length === 0) {
        toast({
          title: 'No hay ausentes',
          description: 'Todos los alumnos registraron asistencia en el día seleccionado.',
        });
        return;
      }

      const groupedByGrupo = dataToExport.reduce((acc, student) => {
        const group = student.grupo;
        if (!acc[group]) {
          acc[group] = [];
        }
        acc[group].push(student);
        return acc;
      }, {} as Record<string, typeof dataToExport>);

      const wb = XLSX.utils.book_new();
      
      const summaryJson = [
        { 'A': 'Fecha del Reporte', 'B': format(selectedDate, "d 'de' MMMM 'de' yyyy", { locale: es }) },
        { 'A': 'Total de Alumnos Ausentes', 'B': dataToExport.length }
      ];

      const summaryWs = XLSX.utils.json_to_sheet(summaryJson, { skipHeader: true });
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Resumen');


      Object.keys(groupedByGrupo).sort().forEach(group => {
        const groupData = groupedByGrupo[group];
        const json_data = groupData.map(student => ({
          'Alumno': student.nombre,
          'Matrícula': student.matricula,
          'Comunidad': student.comunidad,
          'Teléfono del Tutor': student.telefono_tutor,
        }));

        const ws = XLSX.utils.json_to_sheet(json_data);
        XLSX.utils.book_append_sheet(wb, ws, `Grupo ${group}`);
      });

      XLSX.writeFile(wb, `reporte_ausencias_${dateForFilename}.xlsx`);
    } else if (exportType === 'day') {
      const dataToExport = processedAttendance;
      dateForFilename = format(selectedDate, 'yyyy-MM-dd');

      if (dataToExport.length === 0) {
        toast({
          title: 'No hay datos para exportar',
          description: 'No se encontraron registros de asistencia para el día seleccionado.',
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

      const studentSummaryData = allStudents.map(student => {
        if (!student.matricula) return null;
        const studentAttendanceInMonth = attendanceForMonth.filter(a => a.studentId === student.matricula);
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
            'Comunidad': student.comunidad,
            'Días Asistidos': daysAttended,
            'Ausencias': absences,
            '% Asistencia': attendancePercentage, // Kept as number for calculations
            'Entradas Tardías': lateEntries,
        };
      }).filter(s => s !== null) as NonNullable<typeof studentSummaryData[0]>[];
      
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
        if (!item.studentId) continue;
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
              studentId: student.matricula,
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

  if (!selectedDate || attendanceLoading || studentsLoading) {
    return (
      <div className="container mx-auto py-2">
        <PageHeader
          title="Historial de Asistencia"
          description="Selecciona una fecha para revisar los registros del día."
        >
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-32" />
          </div>
        </PageHeader>
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
            <div className="md:col-span-1 md:border-r">
                <div className='p-6'>
                    <div className="flex flex-row items-center justify-between pb-6">
                        <Skeleton className="h-7 w-32" />
                        <div className="flex gap-2">
                            <Skeleton className="h-10 w-10" />
                            <Skeleton className="h-10 w-10" />
                        </div>
                    </div>
                    <div className="grid grid-cols-7 gap-2 text-center">
                        {Array.from({ length: 7 }).map((_, i) => (
                        <div key={i} className="text-sm font-medium text-muted-foreground h-4 w-4 mx-auto">
                            {['D', 'L', 'M', 'X', 'J', 'V', 'S'][i]}
                        </div>
                        ))}
                        {Array.from({ length: 35 }).map((_, i) => (
                        <Skeleton key={i} className="h-10 w-10 rounded-full" />
                        ))}
                    </div>
                </div>
            </div>
            <div className="md:col-span-2">
                <div className='p-6'>
                    <Skeleton className="h-10 w-full mb-6" />
                    <div className="space-y-6">
                        {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex items-start gap-4">
                            <Skeleton className="h-9 w-9 rounded-full" />
                            <div className="grid gap-1.5 w-full">
                            <div className="flex justify-between items-center">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-20" />
                            </div>
                            <div className="flex flex-col gap-2 pt-1">
                                <Skeleton className="h-4 w-40" />
                                <Skeleton className="h-4 w-40" />
                            </div>
                            </div>
                        </div>
                        ))}
                    </div>
                </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-2">
      <PageHeader
        title="Historial de Asistencia"
        description="Selecciona una fecha para revisar los registros del día."
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
                    Exportar Asistencia del Día
                </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => handleExport('absent_day')}>
                    Exportar Ausentes del Día
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('month')}>
                    Exportar Reporte Mensual
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
            <Tabs defaultValue="presentes" className="w-full">
                <div className="p-6 pb-0">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="presentes">Presentes ({processedAttendance.length})</TabsTrigger>
                        <TabsTrigger value="ausentes">Ausentes ({absentStudents.length})</TabsTrigger>
                        <TabsTrigger value="manuales">Manuales ({justifiedRecords.length})</TabsTrigger>
                    </TabsList>
                </div>
                <TabsContent value="presentes">
                    <DailyAttendanceList
                    date={selectedDate}
                    processedAttendance={processedAttendance}
                    />
                </TabsContent>
                <TabsContent value="ausentes">
                    <DailyAbsenceList
                    date={selectedDate}
                    absentStudents={absentStudents}
                    />
                </TabsContent>
                <TabsContent value="manuales">
                    <JustifiedList 
                        date={selectedDate}
                        justifiedRecords={justifiedRecords}
                    />
                </TabsContent>
            </Tabs>
          </div>
        </div>
      </Card>
    </div>
  );
}
