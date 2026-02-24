'use client';

import { CheckCircle2, XCircle, LogIn, LogOut } from 'lucide-react';
import type { NotificationLog } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';

interface NotificationsPanelProps {
  logs: NotificationLog[];
}

const NotificationsPanel = ({ logs }: NotificationsPanelProps) => {
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
                  <p>Reason: {log.reason || 'Unknown Error'}</p>
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
            <p className="text-sm text-muted-foreground">
              {formatDistanceToNow(log.timestamp, { addSuffix: true })}
            </p>
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
