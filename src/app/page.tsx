'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, LogIn, History, Bell } from 'lucide-react';
import StatCard from '@/components/dashboard/stat-card';
import AttendanceFeed from '@/components/dashboard/attendance-feed';
import NotificationsPanel from '@/components/dashboard/notifications-panel';
import type { Student, Attendance, NotificationLog } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore } from '@/firebase';
import { getDocs, collection, query, limit, orderBy } from 'firebase/firestore';
import { isSameDay } from 'date-fns';

export default function DashboardPage() {
  const firestore = useFirestore();
  const [students, setStudents] = React.useState<Student[] | null>(null);
  const [attendance, setAttendance] = React.useState<Attendance[] | null>(null);
  const [notificationLogs, setNotificationLogs] = React.useState<NotificationLog[] | null>(null);
  const [loading, setLoading] = React.useState(true);
  
  React.useEffect(() => {
    if (!firestore) return;

    const fetchData = async () => {
        setLoading(true);
        try {
            const studentsQuery = await getDocs(collection(firestore, 'students'));
            const studentsList = studentsQuery.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
            setStudents(studentsList);

            const attendanceQuery = await getDocs(query(collection(firestore, 'asistencias'), orderBy('timestamp', 'desc')));
            const attendanceList = attendanceQuery.docs.map(doc => {
                 const data = doc.data();
                 for (const key in data) {
                     if (data[key] && typeof data[key].toDate === 'function') {
                         data[key] = data[key].toDate();
                     }
                 }
                 return { id: doc.id, ...data } as Attendance;
            });
            setAttendance(attendanceList);

            const notificationsQuery = await getDocs(query(collection(firestore, 'notificationLogs'), orderBy('timestamp', 'desc'), limit(10)));
            const notificationsList = notificationsQuery.docs.map(doc => {
                 const data = doc.data();
                 if (data.timestamp && typeof data.timestamp.toDate === 'function') {
                     data.timestamp = data.timestamp.toDate();
                 }
                 return { id: doc.id, ...data } as NotificationLog;
            });
            setNotificationLogs(notificationsList);

        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    fetchData();
  }, [firestore]);


  const { presentToday, eventsToday, notificationsLast24h } = React.useMemo(() => {
    if (!attendance || !notificationLogs) {
      return { presentToday: 0, eventsToday: 0, notificationsLast24h: 0 };
    }
    
    const todaysAttendance = attendance.filter(a => a.timestamp && isSameDay(a.timestamp, new Date()));
    const eventsToday = todaysAttendance.length;

    const presentIds = new Set(
      todaysAttendance
        .filter(a => a.type === 'entrada')
        .map(a => a.studentId)
    );
    const presentToday = presentIds.size;

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    const recentNotifications = notificationLogs.filter(log => log.timestamp > twentyFourHoursAgo);
    const notificationsLast24h = recentNotifications.length;

    return { presentToday, eventsToday, notificationsLast24h };
  }, [attendance, notificationLogs]);
  
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
            <NotificationsPanel logs={notificationLogs ?? []} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
