'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, LogIn, History, Bell } from 'lucide-react';
import StatCard from '@/components/dashboard/stat-card';
import AttendanceFeed from '@/components/dashboard/attendance-feed';
import NotificationsPanel from '@/components/dashboard/notifications-panel';
import type { Student, Attendance, NotificationLog } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection } from '@/firebase';

export default function DashboardPage() {
  const { data: students, loading: studentsLoading } = useCollection<Student>('students');
  const { data: attendance, loading: attendanceLoading } = useCollection<Attendance>('asistencias');
  // The notification system is not yet connected to a real backend.
  // It defaults to an empty array to prevent crashing.
  const [notificationLogs] = React.useState<NotificationLog[]>([]);
  const [isClient, setIsClient] = React.useState(false);

  const [presentToday, setPresentToday] = React.useState(0);
  const [eventsToday, setEventsToday] = React.useState(0);
  const [notificationsLast24h, setNotificationsLast24h] = React.useState(0);

  React.useEffect(() => {
    // This effect runs only on the client, after the component has mounted.
    setIsClient(true);
  }, []);

  React.useEffect(() => {
    // We check for isClient to avoid hydration errors, and attendance to make sure data is loaded.
    if (!isClient || !attendance) return;

    const todayString = new Date().toDateString();
    
    const todaysAttendance = attendance.filter(a => a.timestamp.toDateString() === todayString);
    setEventsToday(todaysAttendance.length);

    const presentIds = new Set(
      todaysAttendance
        .filter(a => a.type === 'entrada')
        .map(a => a.studentId)
    );
    setPresentToday(presentIds.size);

    // The notification logs are currently empty. This will result in 0.
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    const recentNotifications = notificationLogs.filter(log => log.timestamp > twentyFourHoursAgo);
    setNotificationsLast24h(recentNotifications.length);

  }, [attendance, notificationLogs, isClient]);
  
  const loading = studentsLoading || attendanceLoading || !isClient;

  const StatCardSkeleton = () => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-3 w-full mt-2" />
      </CardContent>
    </Card>
  )

  if (loading) {
     return (
        <div className="flex flex-col gap-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
            </div>
             <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Registro de Asistencia en Vivo</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <Skeleton className="h-9 w-9 rounded-full" />
                                <div className="grid gap-1.5 flex-1">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Registros de Notificaciones de WhatsApp</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                         {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center">
                                <Skeleton className="h-5 w-5 rounded-full" />
                                <div className="ml-4 space-y-1.5">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
     )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de Alumnos"
          value={students?.length ?? 0}
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
            <AttendanceFeed attendance={(attendance ?? []).slice(0, 10)} />
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
