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
  getYear,
  getMonth,
  setYear,
  setMonth,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CardHeader, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

  const years = React.useMemo(() => Array.from({ length: 21 }, (_, i) => getYear(new Date()) - 10 + i), []);
  const months = React.useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: format(new Date(2000, i), 'MMMM', { locale: es }),
  })), []);

  const handleYearChange = (year: string) => {
    const newDate = setYear(currentMonth, parseInt(year, 10));
    setCurrentMonth(newDate);
  };

  const handleMonthChange = (month: string) => {
    const newDate = setMonth(currentMonth, parseInt(month, 10));
    setCurrentMonth(newDate);
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = startOfWeek(monthStart, { locale: es });
  const endDate = endOfWeek(monthEnd, { locale: es });
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

  return (
    <>
      <CardHeader className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex w-full lg:w-auto gap-2 items-center">
            <Select
                value={getMonth(currentMonth).toString()}
                onValueChange={handleMonthChange}
            >
                <SelectTrigger className="w-full lg:w-[140px] capitalize focus:ring-0">
                    <SelectValue placeholder="Mes" />
                </SelectTrigger>
                <SelectContent>
                    {months.map((month) => (
                        <SelectItem key={month.value} value={month.value.toString()} className="capitalize">
                            {month.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select
                value={getYear(currentMonth).toString()}
                onValueChange={handleYearChange}
            >
                <SelectTrigger className="w-full lg:w-[100px] focus:ring-0">
                    <SelectValue placeholder="Año" />
                </SelectTrigger>
                <SelectContent>
                    {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                            {year}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <div className="flex gap-2 self-end lg:self-center">
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
