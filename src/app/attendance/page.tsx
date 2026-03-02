'use client';

import * as React from 'react';
import { getAttendance } from '@/lib/data';
import { PageHeader } from '@/components/page-header';
import AttendanceCalendar from './attendance-calendar';
import DailyAttendanceList from './daily-attendance-list';
import { isSameDay } from 'date-fns';
import { Card } from '@/components/ui/card';

export default function AttendancePage() {
  const attendanceData = React.useMemo(() => getAttendance(), []);
  const [selectedDate, setSelectedDate] = React.useState(new Date());

  const attendanceForSelectedDay = React.useMemo(() => {
    return attendanceData.filter((a) => isSameDay(a.timestamp, selectedDate));
  }, [attendanceData, selectedDate]);
  
  const daysWithAttendance = React.useMemo(() => {
    return new Set(attendanceData.map(a => a.timestamp.toDateString()));
  }, [attendanceData]);

  return (
    <div className="container mx-auto py-2">
      <PageHeader
        title="Historial de Asistencia"
        description="Selecciona una fecha en el calendario para ver los registros."
      />
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0">
          <div className="lg:col-span-2 md:border-r">
            <AttendanceCalendar 
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              daysWithAttendance={daysWithAttendance}
            />
          </div>
          <div className="md:col-span-1 lg:col-span-1">
            <DailyAttendanceList 
              date={selectedDate}
              attendance={attendanceForSelectedDay}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
