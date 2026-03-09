'use client';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Student } from '@/lib/types';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Calendar as CalendarIcon } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const manualEntrySchema = z.object({
  type: z.enum(['entrada', 'salida'], { required_error: 'Debes seleccionar un tipo.' }),
  date: z.date({ required_error: 'Debes seleccionar una fecha.' }),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Formato de hora inválido (HH:MM).' }),
  reason: z.string().min(5, { message: 'El motivo debe tener al menos 5 caracteres.' }).max(200, { message: 'El motivo no puede exceder los 200 caracteres.'}),
});

type ManualEntryFormValues = z.infer<typeof manualEntrySchema>;

interface ManualEntryFormProps {
    student: Student;
    onSubmit: (data: { type: 'entrada' | 'salida', timestamp: Date, reason: string }) => void;
    onBack: () => void;
}

export function ManualEntryForm({ student, onSubmit, onBack }: ManualEntryFormProps) {
    const form = useForm<ManualEntryFormValues>({
        resolver: zodResolver(manualEntrySchema),
        defaultValues: {
            type: 'entrada',
            date: new Date(),
            time: format(new Date(), 'HH:mm'),
            reason: '',
        },
    });

    const handleSubmit = (data: ManualEntryFormValues) => {
        const [hours, minutes] = data.time.split(':').map(Number);
        const timestamp = new Date(data.date);
        timestamp.setHours(hours, minutes, 0, 0);

        onSubmit({ type: data.type, timestamp, reason: data.reason });
    };

    return (
        <div className="container mx-auto py-2">
            <PageHeader title={`Registro para ${student.nombre}`} description={`Grupo: ${student.grupo} | Matrícula: ${student.matricula}`}>
                <Button variant="outline" onClick={onBack}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Volver a la búsqueda
                </Button>
            </PageHeader>
            <Card>
                <CardHeader>
                    <CardTitle>Añadir Registro Manual de Asistencia</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem className="space-y-3">
                                        <FormLabel>Tipo de Registro</FormLabel>
                                        <FormControl>
                                            <RadioGroup
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                className="flex flex-col space-y-1"
                                            >
                                                <FormItem className="flex items-center space-x-3 space-y-0">
                                                    <FormControl>
                                                        <RadioGroupItem value="entrada" />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">Entrada</FormLabel>
                                                </FormItem>
                                                <FormItem className="flex items-center space-x-3 space-y-0">
                                                    <FormControl>
                                                        <RadioGroupItem value="salida" />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">Salida</FormLabel>
                                                </FormItem>
                                            </RadioGroup>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="date"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Fecha</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant={'outline'}
                                                            className={cn(
                                                                'w-full pl-3 text-left font-normal',
                                                                !field.value && 'text-muted-foreground'
                                                            )}
                                                        >
                                                            {field.value ? (
                                                                format(field.value, 'PPP', { locale: es })
                                                            ) : (
                                                                <span>Elige una fecha</span>
                                                            )}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value}
                                                        onSelect={field.onChange}
                                                        disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="time"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Hora (formato 24h)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="HH:MM" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="reason"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Motivo o Justificación</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Ej. Llegó tarde por cita médica (presenta justificante)."
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="flex justify-end pt-4">
                                <Button type="submit">Guardar Registro</Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
