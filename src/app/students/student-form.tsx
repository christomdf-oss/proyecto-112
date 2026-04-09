'use client';

import * as React from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { PlusCircle, X } from 'lucide-react';

const studentSchema = z.object({
  nombre: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  matricula: z.string().min(1, { message: 'La matrícula es obligatoria.' }),
  telefono_tutor: z.string().min(10, { message: 'El teléfono debe tener al menos 10 caracteres.' }),
  grupo: z.string().min(3, { message: 'Por favor ingresa un grupo.' }),
  comunidad: z.string({ required_error: 'Por favor selecciona una comunidad.' }).min(1, { message: 'Por favor selecciona una comunidad.' }),
});

type StudentFormValues = z.infer<typeof studentSchema>;

interface StudentFormProps {
  onSubmit: (data: StudentFormValues) => void;
  onClose: () => void;
  comunidades: string[];
  onAddComunidad: (comunidad: string) => boolean;
  onRemoveComunidad: (comunidad: string) => void;
}

export function StudentForm({ onSubmit, onClose, comunidades, onAddComunidad, onRemoveComunidad }: StudentFormProps) {
  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
        nombre: '',
        matricula: '',
        telefono_tutor: '',
        grupo: '',
        comunidad: '',
    },
  });

  const [newComunidad, setNewComunidad] = React.useState('');

  const handleAddNewComunidad = () => {
    if (newComunidad.trim()) {
      const success = onAddComunidad(newComunidad.trim());
      if (success) {
        setNewComunidad('');
      }
    }
  };

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
        <FormField
          control={form.control}
          name="comunidad"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Comunidad</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una comunidad" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <div className="p-2">
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Añadir nueva comunidad"
                        value={newComunidad}
                        onChange={(e) => setNewComunidad(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddNewComunidad();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="shrink-0"
                        onClick={handleAddNewComunidad}
                      >
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Separator className="my-1" />
                  <div className="max-h-[200px] overflow-y-auto">
                    {comunidades.map((comunidad) => (
                      <SelectItem
                        key={comunidad}
                        value={comunidad}
                        className="group/item relative pr-10"
                      >
                        {comunidad}
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full opacity-0 group-hover/item:opacity-100"
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                                e.preventDefault();
                                onRemoveComunidad(comunidad);
                            }}
                        >
                            <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </SelectItem>
                    ))}
                    {comunidades.length === 0 && (
                        <div className="text-center text-sm text-muted-foreground p-2">
                            Añade una comunidad para empezar.
                        </div>
                    )}
                  </div>
                </SelectContent>
              </Select>
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
