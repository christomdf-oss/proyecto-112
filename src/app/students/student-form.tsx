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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { PlusCircle, Trash2, ChevronsUpDown } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const studentSchema = z.object({
  nombre: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  matricula: z.string().min(1, { message: 'La matrícula es obligatoria.' }),
  telefono_tutor: z.string().min(10, { message: 'El teléfono debe tener al menos 10 caracteres.' }),
  correo_tutor: z.string().email({ message: 'Por favor ingresa un correo válido.' }),
  grupo: z.string().min(3, { message: 'Por favor ingresa un grupo.' }),
  comunidad: z.string({ required_error: 'Por favor selecciona una comunidad.' }).min(1, { message: 'Por favor selecciona una comunidad.' }),
});

export type StudentFormValues = z.infer<typeof studentSchema>;

interface StudentFormProps {
  onSubmit: (data: StudentFormValues) => void;
  onClose: () => void;
  comunidades: string[];
  onAddComunidad: (comunidad: string) => Promise<boolean> | boolean;
  onRemoveComunidad: (comunidad: string) => Promise<void> | void;
  initialData?: StudentFormValues | null;
}

export function StudentForm({ onSubmit, onClose, comunidades, onAddComunidad, onRemoveComunidad, initialData }: StudentFormProps) {
  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: initialData || {
        nombre: '',
        matricula: '',
        telefono_tutor: '',
        correo_tutor: '',
        grupo: '',
        comunidad: '',
    },
  });

  React.useEffect(() => {
    if (initialData) {
        form.reset(initialData);
    }
  }, [initialData, form]);

  const [newComunidad, setNewComunidad] = React.useState('');
  const [isManaging, setIsManaging] = React.useState(false);
  const isEditing = !!initialData;

  const handleAddNewComunidad = async () => {
    if (!newComunidad.trim()) return;

    try {
      const success = await onAddComunidad(newComunidad.trim());
      if (success) {
        setNewComunidad('');
      }
    } catch (e) {
      // Silenciar errores aquí; `onAddComunidad` ya muestra toasts en la página padre
      console.error('Error en handleAddNewComunidad:', e);
    }
  };

  const handleSubmit = (data: StudentFormValues) => {
    onSubmit(data);
    // No reseteamos el form aquí para que el usuario vea que se envió
  };

  return (
    <>
      <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Alumno' : 'Registrar Nuevo Alumno'}</DialogTitle>
          <DialogDescription>
            Formulario para registrar o editar los datos de un alumno.
          </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-4">
          <ScrollArea className="h-[60vh] pr-6">
            <div className="space-y-4">
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
                      <Input placeholder="Ej. 241010001" {...field} disabled={isEditing} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  name="correo_tutor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo del Tutor</FormLabel>
                      <FormControl>
                        <Input placeholder="tutor@ejemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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
                        {comunidades.length > 0 ? (
                          comunidades.map((comunidad) => (
                            <SelectItem key={comunidad} value={comunidad}>
                              {comunidad}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-center text-sm text-muted-foreground">
                              Añade una comunidad.
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Collapsible open={isManaging} onOpenChange={setIsManaging}>
                  <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full justify-start px-2 -mx-2 text-sm text-muted-foreground">
                          <ChevronsUpDown className="h-4 w-4 mr-2" />
                          Gestionar lista de comunidades
                      </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                      <div className="mt-2 space-y-4 rounded-md border p-4">
                          <p className="text-sm font-medium">Añadir Nueva Comunidad</p>
                          <div className="flex items-center gap-2">
                            <Input
                              placeholder="Nombre de la comunidad"
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

                          <p className="text-sm font-medium pt-2">Comunidades Existentes</p>
                          <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2">
                              {comunidades.length > 0 ? (
                                  comunidades.map(c => (
                                      <div key={c} className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/50">
                                          <span className="text-sm">{c}</span>
                                          <Button
                                              type="button"
                                              variant="ghost"
                                              size="icon"
                                              className="h-7 w-7"
                                              onClick={() => onRemoveComunidad(c)}
                                          >
                                              <Trash2 className="h-4 w-4 text-destructive" />
                                          </Button>
                                      </div>
                                  ))
                              ) : (
                                  <div className="text-center text-sm text-muted-foreground py-4">
                                      Añade una comunidad para empezar.
                                  </div>
                              )}
                          </div>
                      </div>
                  </CollapsibleContent>
              </Collapsible>
            </div>
          </ScrollArea>

          <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit">{isEditing ? 'Guardar Cambios' : 'Guardar Alumno'}</Button>
          </div>
        </form>
      </Form>
    </>
  );
}
