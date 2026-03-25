'use client';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Student, Attendance } from '@/lib/types';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { format, addDays, subDays, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const manualEntrySchema = z.object({
  type: z.enum(['entrada', 'salida', 'justificacion', 'permiso'], { required_error: 'Debes seleccionar un tipo.' }),
  date: z.date({ required_error: 'Debes seleccionar una fecha.' }),
  time: z.string().optional(),
  reason: z.string().max(200, { message: 'El motivo no puede exceder los 200 caracteres.'}).optional(),
}).refine(data => {
    if (data.type === 'justificacion') return true; // time is not required
    return !!data.time && /^([01]\d|2[0-3]):([0-5]\d)$/.test(data.time);
}, {
    message: 'La hora (HH:MM) es requerida para este tipo de registro.',
    path: ['time'],
});

type ManualEntryFormValues = z.infer<typeof manualEntrySchema>;

interface ManualEntryFormProps {
    student: Student;
    onSubmit: (data: { type: Attendance['type'], timestamp: Date, reason?: string }) => void;
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

    const type = form.watch('type');

    const handleSubmit = (data: ManualEntryFormValues) => {
        const timestamp = new Date(data.date);
        if (data.type !== 'justificacion' && data.time) {
            const [hours, minutes] = data.time.split(':').map(Number);
            timestamp.setHours(hours, minutes, 0, 0);
        } else {
            // For justifications, use the start of the day
            timestamp.setHours(0, 0, 0, 0);
        }

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
                    <CardTitle>Añadir Registro Manual</CardTitle>
                    <CardDescription>
                        Usa esta sección si necesitas añadir un registro para un alumno que no está en la lista de ausentes (ej. una salida manual o un permiso).
                    </CardDescription>
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
                                                className="flex flex-col space-y-2"
                                            >
                                                <FormItem className="flex items-center space-x-3 space-y-0">
                                                    <FormControl>
                                                        <RadioGroupItem value="entrada" />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">Registrar Entrada Manual</FormLabel>
                                                </FormItem>
                                                <FormItem className="flex items-center space-x-3 space-y-0">
                                                    <FormControl>
                                                        <RadioGroupItem value="salida" />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">Registrar Salida Manual</FormLabel>
                                                </FormItem>
                                                 <FormItem className="flex items-center space-x-3 space-y-0">
                                                    <FormControl>
                                                        <RadioGroupItem value="justificacion" />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">Justificar Ausencia (día completo, no afecta asistencia)</FormLabel>
                                                </FormItem>
                                                 <FormItem className="flex items-center space-x-3 space-y-0">
                                                    <FormControl>
                                                        <RadioGroupItem value="permiso" />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">Registrar Permiso (salida temporal, no afecta asistencia)</FormLabel>
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
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        type="button"
                                                        onClick={() => field.onChange(subDays(field.value, 1))}
                                                    >
                                                        <ChevronLeft className="h-4 w-4" />
                                                    </Button>
                                                    <FormControl>
                                                        <div
                                                            className={cn(
                                                                'flex h-10 w-full items-center justify-center rounded-md border border-input bg-transparent px-3 text-sm font-medium'
                                                            )}
                                                        >
                                                            {field.value ? (
                                                                format(field.value, 'PPP', { locale: es })
                                                            ) : (
                                                                <span>Elige una fecha</span>
                                                            )}
                                                        </div>
                                                    </FormControl>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        type="button"
                                                        onClick={() => field.onChange(addDays(field.value, 1))}
                                                        disabled={isToday(field.value) || field.value > new Date()}
                                                    >
                                                        <ChevronRight className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                {type !== 'justificacion' && (
                                    <FormField
                                        control={form.control}
                                        name="time"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>Hora (formato 24h)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="HH:MM" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}
                            </div>
                            <FormField
                                control={form.control}
                                name="reason"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Motivo o Justificación (Opcional)</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Ej. Salió a comprar material a la papelería."
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
