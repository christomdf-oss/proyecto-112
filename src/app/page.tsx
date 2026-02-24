import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, LogIn, History, Bell } from 'lucide-react';
import StatCard from '@/components/dashboard/stat-card';
import AttendanceFeed from '@/components/dashboard/attendance-feed';
import NotificationsPanel from '@/components/dashboard/notifications-panel';
import { getStudents, getAttendance, getNotificationLogs } from '@/lib/data';

export default function DashboardPage() {
  const students = getStudents();
  const attendance = getAttendance();
  const notificationLogs = getNotificationLogs();
  
  const presentToday = new Set(
    attendance
      .filter(a => a.timestamp.toDateString() === new Date().toDateString() && a.type === 'entrada')
      .map(a => a.studentId)
  ).size;

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
          value={attendance.filter(a => a.timestamp.toDateString() === new Date().toDateString()).length}
          icon={History}
          description="Eventos de entrada/salida de hoy"
        />
        <StatCard
          title="Notificaciones Enviadas"
          value={notificationLogs.length}
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
