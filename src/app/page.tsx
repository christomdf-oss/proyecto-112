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
          title="Total Students"
          value={students.length}
          icon={Users}
          description="Total registered students"
        />
        <StatCard
          title="Present Today"
          value={presentToday}
          icon={LogIn}
          description="Students who have entered today"
        />
        <StatCard
          title="Today's Events"
          value={attendance.filter(a => a.timestamp.toDateString() === new Date().toDateString()).length}
          icon={History}
          description="Total entry/exit events today"
        />
        <StatCard
          title="Notifications Sent"
          value={notificationLogs.length}
          icon={Bell}
          description="Notifications sent in the last 24h"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Live Attendance Stream</CardTitle>
          </CardHeader>
          <CardContent>
            <AttendanceFeed attendance={attendance.slice(0, 10)} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>WhatsApp Notification Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <NotificationsPanel logs={notificationLogs.slice(0, 7)} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
