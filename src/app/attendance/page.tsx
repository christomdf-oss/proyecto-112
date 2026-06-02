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
import { Download, RefreshCw } from 'lucide-react';
import { io } from 'socket.io-client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import type * as XLSX from 'xlsx';
import { Skeleton } from '@/components/ui/skeleton';

const DEFAULT_KIOSK_API_BASE = 'http://127.0.0.1:5000';

function getKioskApiBase() {
  const envUrl = process.env.NEXT_PUBLIC_KIOSK_URL?.trim();
  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol || 'http:';
    const hostname = window.location.hostname || '127.0.0.1';
    return `${protocol}//${hostname}:5000`;
  }

  return DEFAULT_KIOSK_API_BASE;
}

export default function AttendancePage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [attendanceData, setAttendanceData] = React.useState<Attendance[]>([]);
  const [allStudents, setAllStudents] = React.useState<Student[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedDate, setSelectedDate] = React.useState<Date>();

  const fetchData = React.useCallback(async () => {
    if (!firestore) return;
    setLoading(true);
    try {
      const studentsQuery = getDocs(collection(firestore, 'students'));
      const attendanceQuery = getDocs(
        query(collection(firestore, 'asistencias'), orderBy('timestamp', 'desc'))
      );

      const [studentsSnapshot, attendanceSnapshot] = await Promise.all([
        studentsQuery,
        attendanceQuery,
      ]);

      const studentsList = studentsSnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as Student))
        .filter((s) => s.matricula && s.nombre);
      setAllStudents(studentsList);

      const attendanceList = attendanceSnapshot.docs.map((doc) => {
        const data = doc.data();
        for (const key in data) {
          if (data[key] && typeof data[key].toDate === 'function') {
            data[key] = data[key].toDate();
          }
        }
        return { id: doc.id, ...data } as Attendance;
      });

      console.log('Registros encontrados:', attendanceList);
      setAttendanceData(attendanceList);
    } catch (error) {
      console.error('Error fetching data for attendance page:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar los datos.',
      });
    } finally {
      setLoading(false);
    }
  }, [firestore, toast]);

  const [attendanceMode, setAttendanceMode] = React.useState<'entrada' | 'salida' | null>(null);
  const [attendanceActive, setAttendanceActive] = React.useState(false);
  const [attendanceLoading, setAttendanceLoading] = React.useState(false);
  const [activityLog, setActivityLog] = React.useState<string[]>([]);
  const [socketConnected, setSocketConnected] = React.useState(false);

  const pushActivityLog = React.useCallback((message: string) => {
    setActivityLog((current) => [message, ...current].slice(0, 10));
  }, []);

  const callKioskApi = React.useCallback(async (path: string, options?: RequestInit) => {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const apiBase = getKioskApiBase();
    const url = `${apiBase}${normalizedPath}`;

    try {
      const response = await fetch(url, {
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        ...options,
      });

      const contentType = response.headers.get('content-type') || '';
      const text = await response.text();
      const data = text && contentType.includes('application/json') ? JSON.parse(text) : null;

      if (!response.ok) {
        console.error('Kiosk API returned error:', response.status, data);
        toast({
          variant: 'destructive',
          title: 'Error de servidor biométrico',
          description: data?.error || `HTTP ${response.status}`,
        });
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error calling kiosk API:', error);
      toast({
        variant: 'destructive',
        title: 'Error de conexión',
        description: `Fallo al conectar con ${url}. Revisa que el servidor biométrico esté activo.`,
      });
      return null;
    }
  }, [toast]);

  React.useEffect(() => {
    const socket = io(getKioskApiBase(), {
      path: '/socket.io',
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      setSocketConnected(true);
      pushActivityLog('Conectado al servidor de asistencia biométrica.');
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
      pushActivityLog('Desconectado del servidor biométrico.');
    });

    socket.on('attendance_marked', (payload: any) => {
      const message = `Asistencia registrada: ${payload.studentName} (${payload.action})`;
      pushActivityLog(message);
      toast({
        title: 'Asistencia registrada',
        description: message,
      });
      fetchData();
    });

    socket.on('attendance_error', (payload: any) => {
      const message = payload?.error || 'Error desconocido en el servidor biométrico.';
      pushActivityLog(`Error: ${message}`);
      toast({
        variant: 'destructive',
        title: 'Error de asistencia',
        description: message,
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchData, pushActivityLog, toast]);

  const refreshAttendanceStatus = React.useCallback(async () => {
    const status = await callKioskApi('/api/attendance-status');
    if (status?.success) {
      setAttendanceActive(status.attendance_mode ?? false);
      setAttendanceMode(status.attendance_type ?? null);
    }
  }, [callKioskApi]);

  React.useEffect(() => {
    setSelectedDate(new Date());
    fetchData();
    refreshAttendanceStatus();
  }, [fetchData, refreshAttendanceStatus]);

  const startAttendance = React.useCallback(async (mode: 'entrada' | 'salida') => {
    setAttendanceLoading(true);
    const result = await callKioskApi('/api/start-attendance', {
      method: 'POST',
      body: JSON.stringify({ type: mode }),
    });

    if (result?.success) {
      setAttendanceActive(true);
      setAttendanceMode(mode);
      pushActivityLog(`Modo de asistencia iniciado: ${mode}`);
      toast({
        title: 'Modo iniciado',
        description: `El sistema está listo para ${mode === 'entrada' ? 'entradas' : 'salidas'}.`,
      });
    }

    setAttendanceLoading(false);
  }, [callKioskApi, pushActivityLog, toast]);

  const stopAttendance = React.useCallback(async () => {
    setAttendanceLoading(true);
    const result = await callKioskApi('/api/stop-attendance', {
      method: 'POST',
    });

    if (result?.success) {
      setAttendanceActive(false);
      setAttendanceMode(null);
      pushActivityLog('Sistema de asistencia detenido.');
      toast({
        title: 'Sistema detenido',
        description: 'La escucha biométrica se ha detenido.',
      });
    }

    setAttendanceLoading(false);
  }, [callKioskApi, pushActivityLog, toast]);

  const modeLabel = attendanceActive
    ? attendanceMode === 'entrada'
      ? 'Entradas activas'
      : 'Salidas activas'
    : 'Sistema inactivo';

  const modeStatus = attendanceActive
    ? attendanceMode === 'entrada'
      ? 'Modo Entradas'
      : 'Modo Salidas'
    : 'Detenido';

  const statusBadge = socketConnected ? 'Conectado' : 'Desconectado';

  const startAttendanceButton = (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        onClick={() => startAttendance('entrada')}
        disabled={attendanceLoading || attendanceActive}
      >
        Iniciar Entradas
      </Button>
      <Button
        variant="outline"
        onClick={() => startAttendance('salida')}
        disabled={attendanceLoading || attendanceActive}
      >
        Iniciar Salidas
      </Button>
      <Button
        variant="secondary"
        onClick={stopAttendance}
        disabled={attendanceLoading || !attendanceActive}
      >
        Detener Sistema
      </Button>
    </div>
  );

  const statusCard = (
    <Card className="mb-4 p-4">
      <div className="mb-2 text-sm text-slate-500">Estado del servidor biométrico</div>
      <div className="flex flex-wrap items-center gap-4">
        <div className="rounded-md border border-slate-200 px-3 py-2 text-sm">
          {statusBadge}
        </div>
        <div className="rounded-md border border-slate-200 px-3 py-2 text-sm">
          {modeStatus}
        </div>
      </div>
    </Card>
  );

  const activityLogPanel = (
    <Card className="mb-4 p-4">
      <div className="mb-2 text-sm text-slate-500">Actividad en tiempo real</div>
      <div className="space-y-2 text-sm">
        {activityLog.length === 0 ? (
          <div className="text-slate-600">No se han recibido eventos todavía.</div>
        ) : (
          activityLog.map((item, index) => (
            <div key={`${item}-${index}`} className="rounded-md bg-slate-50 px-3 py-2">
              {item}
            </div>
          ))
        )}
      </div>
    </Card>
  );

  const processedAttendance = React.useMemo(() => {
    if (!attendanceData || !allStudents || !selectedDate) return [];
    const attendanceForSelectedDay = attendanceData.filter((a) =>
      isSameDay(a.timestamp, selectedDate)
    );
    const studentsById = new Map(allStudents.map((s) => [s.matricula, s]));
    const attendanceByStudent = new Map<
      string,
      { entrada: Date | null; salida: Date | null }
    >();

    for (const item of attendanceForSelectedDay) {
      if (!studentsById.has(item.studentId)) continue;
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
      if (student && times.entrada) {
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
    const presentStudentIds = new Set(
      processedAttendance.map((a) => a.studentId)
    );
    return allStudents
      .filter((student) => student.matricula && !presentStudentIds.has(student.matricula))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [allStudents, processedAttendance, selectedDate]);

  const justifiedRecords = React.useMemo(() => {
    if (!attendanceData || !selectedDate) return [];
    return attendanceData
      .filter((a) => a.isManual && isSameDay(a.timestamp, selectedDate))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
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
          description:
            'Todos los alumnos registraron asistencia en el día seleccionado.',
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
        {
          A: 'Fecha del Reporte',
          B: format(selectedDate, "d 'de' MMMM 'de' yyyy", { locale: es }),
        },
        { A: 'Total de Alumnos Ausentes', B: dataToExport.length },
      ];

      const summaryWs = XLSX.utils.json_to_sheet(summaryJson, {
        skipHeader: true,
      });
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Resumen');

      Object.keys(groupedByGrupo)
        .sort()
        .forEach((group) => {
          const groupData = groupedByGrupo[group];
          const json_data = groupData.map((student) => ({
            Alumno: student.nombre,
            Matrícula: student.matricula,
            Comunidad: student.comunidad,
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
          description:
            'No se encontraron registros de asistencia para el día seleccionado.',
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

      Object.keys(groupedByGrupo)
        .sort()
        .forEach((group) => {
          const groupData = groupedByGrupo[group];
          const json_data = groupData.map((item) => ({
            Alumno: item.studentName,
            Entrada: item.entrada
              ? format(item.entrada, 'p', { locale: es })
              : 'Sin registro',
            Salida: item.salida
              ? format(item.salida, 'p', { locale: es })
              : 'Sin registro',
          }));

          const ws = XLSX.utils.json_to_sheet(json_data);
          XLSX.utils.book_append_sheet(wb, ws, `Grupo ${group}`);
        });

      XLSX.writeFile(wb, `asistencia_diaria_${dateForFilename}.xlsx`);
    } else {
      // 'month' export
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
      const schoolDaysInMonth = new Set(
        attendanceForMonth.map((a) => a.timestamp.toDateString())
      );
      const totalSchoolDays = schoolDaysInMonth.size;

      const studentSummaryData = allStudents
        .map((student) => {
          if (!student.matricula) return null;
          const studentAttendanceInMonth = attendanceForMonth.filter(
            (a) => a.studentId === student.matricula
          );
          const attendedDays = new Set(
            studentAttendanceInMonth
              .filter((a) => a.type === 'entrada')
              .map((a) => a.timestamp.toDateString())
          );

          let lateEntries = 0;
          const lateEntryThresholdMinutes = 15; // After 8:15 AM is late

          studentAttendanceInMonth.forEach((a) => {
            if (a.type === 'entrada') {
              if (
                a.timestamp.getHours() > 8 ||
                (a.timestamp.getHours() === 8 &&
                  a.timestamp.getMinutes() > lateEntryThresholdMinutes)
              ) {
                lateEntries++;
              }
            }
          });

          const daysAttended = attendedDays.size;
          const absences = totalSchoolDays - daysAttended;
          const attendancePercentage =
            totalSchoolDays > 0 ? (daysAttended / totalSchoolDays) * 100 : 0;

          return {
            Alumno: student.nombre,
            Grupo: student.grupo,
            Comunidad: student.comunidad,
            'Días Asistidos': daysAttended,
            Ausencias: absences,
            '% Asistencia': attendancePercentage, // Kept as number for calculations
            'Entradas Tardías': lateEntries,
          };
        })
        .filter((s) => s !== null) as NonNullable<
        typeof studentSummaryData[0]
      >[];

      const groupAvgAttendance: Record<
        string,
        { total: number; count: number }
      > = {};
      studentSummaryData.forEach((s) => {
        if (!groupAvgAttendance[s.Grupo]) {
          groupAvgAttendance[s.Grupo] = { total: 0, count: 0 };
        }
        groupAvgAttendance[s.Grupo].total += s['% Asistencia'];
        groupAvgAttendance[s.Grupo].count++;
      });

      const groupSummaryJson = Object.keys(groupAvgAttendance)
        .sort()
        .map((group) => ({
          Grupo: group,
          '% Asistencia Promedio': `${(
            groupAvgAttendance[group].total / groupAvgAttendance[group].count
          ).toFixed(1)}%`,
        }));

      const studentSummaryJson = studentSummaryData
        .map((s) => ({
          ...s,
          '% Asistencia': `${s['% Asistencia'].toFixed(1)}%`,
          'Requiere Atención': s['% Asistencia'] < 80 ? 'Sí' : 'No',
        }))
        .sort(
          (a, b) =>
            a.Grupo.localeCompare(b.Grupo) || a.Alumno.localeCompare(b.Alumno)
        );

      const summaryWs = XLSX.utils.json_to_sheet(studentSummaryJson);
      XLSX.utils.sheet_add_json(summaryWs, [{}], { origin: -1 });
      XLSX.utils.sheet_add_json(
        summaryWs,
        [{ 'Resumen por Grupo': '' }],
        { origin: -1, skipHeader: true }
      );
      XLSX.utils.sheet_add_json(summaryWs, groupSummaryJson, { origin: -1 });

      XLSX.utils.book_append_sheet(wb, summaryWs, 'Resumen Mensual');

      // --- END: Summary Sheet Logic ---

      // --- START: Detailed Sheets Logic ---
      const monthlyData = new Map<
        string,
        Map<string, { entrada: Date | null; salida: Date | null }>
      >();

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
          if (
            !studentRecords.entrada ||
            item.timestamp < studentRecords.entrada
          ) {
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
      const dataToExport = flatMonthData.sort(
        (a, b) =>
          a.date.getTime() - b.date.getTime() ||
          a.studentName.localeCompare(b.studentName)
      );

      const groupedByGrupo = dataToExport.reduce((acc, item) => {
        const group = item.grupo;
        if (!acc[group]) {
          acc[group] = [];
        }
        acc[group].push(item);
        return acc;
      }, {} as Record<string, typeof dataToExport>);

      Object.keys(groupedByGrupo)
        .sort()
        .forEach((group) => {
          const groupData = groupedByGrupo[group];
          const json_data = groupData.map((item) => ({
            Fecha: item.date
              ? format(item.date, 'eeee dd, MMMM', { locale: es })
              : '',
            Alumno: item.studentName,
            Entrada: item.entrada
              ? format(item.entrada, 'p', { locale: es })
              : 'Sin registro',
            Salida: item.salida
              ? format(item.salida, 'p', { locale: es })
              : 'Sin registro',
          }));

          const ws = XLSX.utils.json_to_sheet(json_data);
          XLSX.utils.book_append_sheet(wb, ws, `Grupo ${group}`);
        });
      // --- END: Detailed Sheets Logic ---

      XLSX.writeFile(wb, `reporte_mensual_asistencia_${dateForFilename}.xlsx`);
    }
  };

  if (!selectedDate || loading) {
    return (
      <div className="container mx-auto py-2">
        <PageHeader
          title="Control de Asistencia Biométrica"
          description="Visualiza historial y gestiona el modo de asistencia en tiempo real."
        >
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-28" />
          </div>
        </PageHeader>
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
            <div className="md:col-span-1 md:border-r">
              <div className="p-6">
                <div className="flex flex-row items-center justify-between pb-6">
                  <Skeleton className="h-7 w-32" />
                  <div className="flex gap-2">
                    <Skeleton className="h-10 w-10" />
                    <Skeleton className="h-10 w-10" />
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-2 text-center">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div
                      key={i}
                      className="text-sm font-medium text-muted-foreground h-4 w-4 mx-auto"
                    >
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
              <div className="p-6">
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
        title="Control de Asistencia Biométrica"
        description="Selecciona una fecha para revisar los registros del día."
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refrescar
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button disabled={loading}>
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
      <div className="grid gap-4 mb-4">
        {statusCard}
        <Card className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="text-sm text-slate-500">Modo de captura</div>
              <div className="text-lg font-semibold">{modeLabel}</div>
            </div>
            <div className="flex flex-wrap gap-2">{startAttendanceButton}</div>
          </div>
        </Card>
        {activityLogPanel}
      </div>
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
                  <TabsTrigger value="presentes">
                    Presentes ({processedAttendance.length})
                  </TabsTrigger>
                  <TabsTrigger value="ausentes">
                    Ausentes ({absentStudents.length})
                  </TabsTrigger>
                  <TabsTrigger value="manuales">
                    Manuales ({justifiedRecords.length})
                  </TabsTrigger>
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
