'use client';

import { CheckCircle2, XCircle, LogIn, LogOut } from 'lucide-react';
import type { NotificationLog } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { useState, useEffect } from 'react';
import { Skeleton } from '../ui/skeleton';

interface NotificationsPanelProps {
  logs: NotificationLog[];
}

const NotificationsPanel = ({ logs }: NotificationsPanelProps) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <div key={log.id} className="flex items-center">
          {log.status === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <XCircle className="h-5 w-5 text-destructive" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Razón: {log.reason || 'Error Desconocido'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none flex items-center gap-2">
              {log.studentName}
              {log.eventType === 'entrada' ? (
                <LogIn className="h-3 w-3 text-muted-foreground" />
              ) : (
                <LogOut className="h-3 w-3 text-muted-foreground" />
              )}
            </p>
            <div className="text-sm text-muted-foreground">
              {isClient ? (
                formatDistanceToNow(log.timestamp, { addSuffix: true, locale: es })
              ) : (
                <Skeleton className="h-4 w-24" />
              )}
            </div>
          </div>
          <div className="ml-auto text-sm text-muted-foreground capitalize">
            {log.eventType}
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationsPanel;
