'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, LogIn, History, Bell } from 'lucide-react';
import StatCard from '@/components/dashboard/stat-card';
import AttendanceFeed from '@/components/dashboard/attendance-feed';
import NotificationsPanel from '@/components/dashboard/notifications-panel';
import { getStudents, getAttendance, getNotificationLogs } from '@/lib/data';

export default function DashboardPage() {
  const students = React.useMemo(() => getStudents(), []);
  const attendance = React.useMemo(() => getAttendance(), []);
  const notificationLogs = React.useMemo(() => getNotificationLogs(), []);

  const [presentToday, setPresentToday] = React.useState(0);
  const [eventsToday, setEventsToday] = React.useState(0);
  const [notificationsLast24h, setNotificationsLast24h] = React.useState(0);

  React.useEffect(() => {
    const todayString = new Date().toDateString();
    
    const todaysAttendance = attendance.filter(a => a.timestamp.toDateString() === todayString);
    setEventsToday(todaysAttendance.length);

    const presentIds = new Set(
      todaysAttendance
        .filter(a => a.type === 'entrada')
        .map(a => a.studentId)
    );
    setPresentToday(presentIds.size);

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    const recentNotifications = notificationLogs.filter(log => log.timestamp > twentyFourHoursAgo);
    setNotificationsLast24h(recentNotifications.length);

  }, [attendance, notificationLogs]);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de Alumnos"
          value={students.length}
          icon={Users}
          description="Alumnos registrados en total"
        />
        <StatCard
          title="Presentes Hoy"
          value={presentToday}
          icon={LogIn}
          description="Alumnos que han entrado hoy"
        />
        <StatCard
          title="Eventos de Hoy"
          value={eventsToday}
          icon={History}
          description="Eventos de entrada/salida de hoy"
        />
        <StatCard
          title="Notificaciones Enviadas"
          value={notificationsLast24h}
          icon={Bell}
          description="Notificaciones enviadas en las últimas 24h"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Registro de Asistencia en Vivo</CardTitle>
          </CardHeader>
          <CardContent>
            <AttendanceFeed attendance={attendance.slice(0, 10)} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Registros de Notificaciones de WhatsApp</CardTitle>
          </CardHeader>
          <CardContent>
            <NotificationsPanel logs={notificationLogs.slice(0, 7)} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
