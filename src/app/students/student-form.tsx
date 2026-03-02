'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const studentSchema = z.object({
  nombre: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  matricula: z.string().min(1, { message: 'La matrícula es obligatoria.' }),
  telefono_tutor: z.string().min(10, { message: 'El teléfono debe tener al menos 10 caracteres.' }),
  grupo: z.string().min(3, { message: 'Por favor ingresa un grupo.' }),
});

type StudentFormValues = z.infer<typeof studentSchema>;

interface StudentFormProps {
  onSubmit: (data: StudentFormValues) => void;
  onClose: () => void;
}

export function StudentForm({ onSubmit, onClose }: StudentFormProps) {
  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
        nombre: '',
        matricula: '',
        telefono_tutor: '',
        grupo: '',
    },
  });

  const handleSubmit = (data: StudentFormValues) => {
    onSubmit(data);
    form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre Completo</FormLabel>
              <FormControl>
                <Input placeholder="Ej. Juan Pérez" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="matricula"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Matrícula</FormLabel>
              <FormControl>
                <Input placeholder="Ej. 241010001" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="telefono_tutor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Teléfono del Tutor</FormLabel>
              <FormControl>
                <Input placeholder="Ej. 55 1234 5678" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="grupo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Grupo</FormLabel>
              <FormControl>
                <Input placeholder="Ej. 101" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">Guardar Alumno</Button>
        </div>
      </form>
    </Form>
  );
}
