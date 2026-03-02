'use client';

import { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { Attendance } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface DailyAttendanceListProps {
  date: Date;
  attendance: Attendance[];
}

export default function DailyAttendanceList({ date, attendance }: DailyAttendanceListProps) {
  return (
    <>
      <CardHeader>
        <CardTitle className="capitalize">
          {format(date, "eeee, d 'de' MMMM", { locale: es })}
        </CardTitle>
        <CardDescription>
          {attendance.length} registro(s) encontrado(s).
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[430px] overflow-y-auto">
        {attendance.length > 0 ? (
          <div className="space-y-4">
            {attendance.map((item) => (
              <div key={item.id} className="flex items-center gap-4">
                <Avatar className="h-9 w-9">
                  <AvatarFallback>
                    {item.studentName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="grid gap-1">
                  <p className="text-sm font-medium leading-none">{item.studentName}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(item.timestamp, 'p', { locale: es })}
                  </p>
                </div>
                <div className="ml-auto font-medium">
                  <Badge variant={item.type === 'entrada' ? 'success' : 'destructive'} className="capitalize">
                    {item.type}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-center text-muted-foreground">
            <p>No hay registros de asistencia para esta fecha.</p>
          </div>
        )}
      </CardContent>
    </>
  );
}
