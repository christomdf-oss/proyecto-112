'use client';

import * as React from 'react';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DataTable } from './data-table';
import { columns } from './columns';
import { getStudents } from '@/lib/data';
import { PageHeader } from '@/components/page-header';
import { StudentForm } from './student-form';
import type { Student } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export default function StudentsPage() {
  const [students, setStudents] = React.useState(() => getStudents());
  const [isAddStudentOpen, setIsAddStudentOpen] = React.useState(false);
  const { toast } = useToast();

  const uniqueGroups = React.useMemo(() => {
    const groups = new Set(students.map((s) => s.grupo));
    return Array.from(groups).sort();
  }, [students]);

  const handleAddStudent = (data: Omit<Student, 'id' | 'id_huella'> & { id_huella: number }) => {
    const newStudent: Student = {
        id: `student_${Date.now()}`, // simple unique id
        ...data,
    };
    setStudents((prev) => [newStudent, ...prev]);
    setIsAddStudentOpen(false);
    toast({
        title: "Alumno Registrado",
        description: `${data.nombre} ha sido agregado exitosamente.`,
    })
  };

  return (
    <div className="container mx-auto py-2">
      <PageHeader 
        title="Gestión de Alumnos"
        description="Ver, agregar y gestionar perfiles de alumnos."
      >
        <Dialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
            <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Registrar Alumno
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Registrar Nuevo Alumno</DialogTitle>
                </DialogHeader>
                <StudentForm 
                    onSubmit={handleAddStudent}
                    onClose={() => setIsAddStudentOpen(false)}
                />
            </DialogContent>
        </Dialog>
      </PageHeader>
      <Card>
        <CardContent className="pt-6">
          <DataTable columns={columns} data={students} groups={uniqueGroups} />
        </CardContent>
      </Card>
    </div>
  );
}
