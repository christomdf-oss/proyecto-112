'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { Attendance } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import { Skeleton } from '../ui/skeleton';

interface AttendanceFeedProps {
  attendance: Attendance[];
}

const AttendanceFeed = ({ attendance }: AttendanceFeedProps) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
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
            <div className="text-sm text-muted-foreground">
              {isClient ? (
                formatDistanceToNow(item.timestamp, { addSuffix: true, locale: es })
              ) : (
                <Skeleton className="h-4 w-24" />
              )}
            </div>
          </div>
          <div className="ml-auto font-medium">
            <Badge variant={item.type === 'entrada' ? 'success' : 'destructive'} className="capitalize">
              {item.type}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AttendanceFeed;
