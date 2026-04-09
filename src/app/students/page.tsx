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
import { getColumns } from './columns';
import { getStudents } from '@/lib/data';
import { PageHeader } from '@/components/page-header';
import { StudentForm } from './student-form';
import type { Student } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { EnrollFingerprintDialog } from './enroll-fingerprint-dialog';

// Infer the form values type from the StudentForm component
type StudentFormValues = Parameters<typeof StudentForm>[0]['onSubmit'] extends (data: infer T) => void ? T : never;

const initialComunidades = ['CHICBUL', 'PLAN DE AYALA', 'JOBAL', 'CHECKOBUL', 'PITAL', 'EL CARMEN'];

export default function StudentsPage() {
  const [students, setStudents] = React.useState(() => getStudents());
  const [isAddStudentOpen, setIsAddStudentOpen] = React.useState(false);
  const [enrollmentStudent, setEnrollmentStudent] = React.useState<Student | null>(null);
  const [comunidades, setComunidades] = React.useState(initialComunidades);
  const { toast } = useToast();

  const handleAddStudent = (data: StudentFormValues) => {
    const newStudent: Student = {
        ...data,
        fingerprintRegistered: false,
    };
    setStudents((prev) => [newStudent, ...prev]);
    setIsAddStudentOpen(false);
    toast({
        title: "Alumno Registrado",
        description: `${data.nombre} ha sido agregado exitosamente.`,
    })
  };
  
  const handleAddComunidad = (newComunidad: string) => {
    const upperCaseComunidad = newComunidad.toUpperCase();
    if (upperCaseComunidad && !comunidades.includes(upperCaseComunidad)) {
      setComunidades(prev => [...prev, upperCaseComunidad].sort());
      toast({
        title: "Comunidad Agregada",
        description: `${upperCaseComunidad} ha sido agregada a la lista.`,
      });
      return true;
    }
    if (comunidades.includes(upperCaseComunidad)) {
        toast({
            variant: "destructive",
            title: "Comunidad ya existe",
            description: `${upperCaseComunidad} ya está en la lista.`,
        });
    }
    return false;
  };

  const handleRemoveComunidad = (comunidadToRemove: string) => {
    setComunidades(prev => prev.filter(c => c !== comunidadToRemove));
    toast({
        variant: "destructive",
        title: "Comunidad Eliminada",
        description: `${comunidadToRemove} ha sido eliminada de la lista.`,
    });
  };
  
  const handleOpenEnrollDialog = (student: Student) => {
    setEnrollmentStudent(student);
  };
  
  const handleCloseEnrollDialog = () => {
    setEnrollmentStudent(null);
  };

  const handleEnrollSuccess = (matricula: string) => {
    setStudents(prev => 
      prev.map(s => 
        s.matricula === matricula ? { ...s, fingerprintRegistered: true } : s
      )
    );
    // The dialog will be closed after success message is shown
  };
  
  const studentColumns = getColumns({ onEnroll: handleOpenEnrollDialog });

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
                    comunidades={comunidades}
                    onAddComunidad={handleAddComunidad}
                    onRemoveComunidad={handleRemoveComunidad}
                />
            </DialogContent>
        </Dialog>
      </PageHeader>
      <Card>
        <CardContent className="pt-6">
          <DataTable columns={studentColumns} data={students} />
        </CardContent>
      </Card>
      
      {enrollmentStudent && (
        <EnrollFingerprintDialog 
            student={enrollmentStudent}
            onSuccess={handleEnrollSuccess}
            onClose={handleCloseEnrollDialog}
        />
      )}
    </div>
  );
}
