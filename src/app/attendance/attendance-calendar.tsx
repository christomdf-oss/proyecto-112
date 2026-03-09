'use client';

import * as React from 'react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CardHeader, CardContent } from '@/components/ui/card';

interface AttendanceCalendarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  daysWithAttendance: Set<string>;
}

export default function AttendanceCalendar({ selectedDate, onDateChange, daysWithAttendance }: AttendanceCalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(startOfMonth(selectedDate));

  React.useEffect(() => {
    setCurrentMonth(startOfMonth(selectedDate));
  }, [selectedDate])

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = startOfWeek(monthStart, { locale: es });
  const endDate = endOfWeek(monthEnd, { locale: es });
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

  return (
    <>
      <CardHeader className="flex flex-row items-center justify-between">
        <h2 className="text-lg font-semibold capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2 text-center">
          {weekDays.map((day, i) => (
            <div key={i} className="text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}
          {days.map((day) => (
            <div
              key={day.toString()}
              className={cn(
                'relative flex items-center justify-center',
                !isSameMonth(day, currentMonth) && 'text-muted-foreground/50'
              )}
            >
              <button
                onClick={() => onDateChange(day)}
                className={cn(
                  'h-10 w-10 rounded-full flex items-center justify-center transition-colors',
                  isToday(day) && !isSameDay(day, selectedDate) && 'bg-accent/50 text-accent-foreground',
                  isSameDay(day, selectedDate)
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'hover:bg-accent hover:text-accent-foreground'
                )}
              >
                {format(day, 'd')}
              </button>
              {daysWithAttendance.has(day.toDateString()) && (
                <div className="absolute bottom-1.5 h-1.5 w-1.5 rounded-full bg-destructive" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </>
  );
}
