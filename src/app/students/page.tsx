'use client';

import * as React from 'react';
import { PlusCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DataTable } from './data-table';
import { getColumns } from './columns';
import { PageHeader } from '@/components/page-header';
import { StudentForm } from './student-form';
import type { Student } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { EnrollFingerprintDialog } from './enroll-fingerprint-dialog';
import { useFirestore } from '@/firebase';
import { doc, setDoc, deleteDoc, getDocs, collection } from 'firebase/firestore';

type StudentFormValues = Parameters<typeof StudentForm>[0]['onSubmit'] extends (data: infer T) => void ? T : never;

const initialComunidades = ['CHICBUL', 'PLAN DE AYALA', 'JOBAL', 'CHECKOBUL', 'PITAL', 'EL CARMEN'];

export default function StudentsPage() {
  const firestore = useFirestore();
  const [students, setStudents] = React.useState<Student[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingStudent, setEditingStudent] = React.useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = React.useState<Student | null>(null);

  const [enrollmentStudent, setEnrollmentStudent] = React.useState<Student | null>(null);
  const [comunidades, setComunidades] = React.useState(initialComunidades);
  
  const fetchStudents = React.useCallback(async () => {
    if (!firestore) return;
    setLoading(true);
    try {
      const studentsSnapshot = await getDocs(collection(firestore, 'students'));
      const studentsList = studentsSnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as Student))
        .filter((s) => s.matricula && s.nombre);
      setStudents(studentsList);
    } catch (error: any) {
      console.error("Error al cargar alumnos:", error);
      toast({ variant: 'destructive', title: 'Error al cargar alumnos', description: `No se pudieron cargar los datos: ${error.message}` });
    } finally {
      setLoading(false);
    }
  }, [firestore, toast]);
  
  React.useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);


  const closeForm = () => {
    setIsFormOpen(false);
    setEditingStudent(null);
  };

  const handleFormSubmit = async (data: StudentFormValues) => {
    if (editingStudent) { // Update logic
      await handleUpdateStudent(data);
    } else { // Create logic
      await handleAddStudent(data);
    }
  };

  const handleAddStudent = async (data: StudentFormValues) => {
    if (!firestore) return;

    // The new student won't have a fingerprintId yet.
    const newStudent: Omit<Student, 'id' | 'fingerprintId'> = {
        ...data,
    };
    
    try {
      const studentRef = doc(firestore, 'students', newStudent.matricula);
      await setDoc(studentRef, newStudent);
      
      closeForm();
      toast({
          title: "Alumno Registrado",
          description: `${data.nombre} ha sido agregado exitosamente.`,
      });
      await fetchStudents();
    } catch (error: any) {
      console.error("Error detallado al añadir documento:", error);
      toast({ variant: 'destructive', title: 'Error al guardar', description: error.message });
    }
  };

  const handleUpdateStudent = async (data: StudentFormValues) => {
    if (!firestore || !editingStudent) return;

    try {
      const studentRef = doc(firestore, 'students', editingStudent.matricula);
      // We merge to avoid overwriting the fingerprintId
      await setDoc(studentRef, data, { merge: true });

      closeForm();
      toast({
        title: 'Alumno Actualizado',
        description: `El perfil de ${data.nombre} ha sido actualizado.`,
      });
      await fetchStudents();
    } catch (e: any) {
       console.error("Error al actualizar alumno:", e);
       toast({ variant: 'destructive', title: 'Error al actualizar', description: e.message });
    }
  };

  const handleDeleteStudent = async () => {
    if (!firestore || !studentToDelete || !studentToDelete.id) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo identificar al alumno a eliminar.' });
        setStudentToDelete(null);
        return;
    };

    try {
      await deleteDoc(doc(firestore, 'students', studentToDelete.id));
      
      toast({
        variant: "destructive",
        title: 'Alumno Eliminado',
        description: `El perfil de ${studentToDelete.nombre} ha sido eliminado.`,
      });
       await fetchStudents();
    } catch (e: any) {
      console.error("Error al eliminar alumno:", e);
      toast({ variant: 'destructive', title: 'Error al eliminar', description: `Ocurrió un error: ${e.message}` });
    } finally {
      setStudentToDelete(null);
    }
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

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setIsFormOpen(true);
  };

  const handleDelete = (student: Student) => {
    setStudentToDelete(student);
  };
  
  const handleCopyMatricula = (matricula: string) => {
    navigator.clipboard.writeText(matricula);
    toast({ title: 'Copiado', description: 'La matrícula ha sido copiada al portapapeles.' });
  }
  
  const studentColumns = getColumns({ 
    onEnroll: handleOpenEnrollDialog,
    onEdit: handleEdit,
    onDelete: handleDelete,
    onCopyMatricula: handleCopyMatricula
  });

  return (
    <div className="container mx-auto py-2">
      <PageHeader 
        title="Gestión de Alumnos"
        description="Ver, agregar y gestionar perfiles de alumnos."
      >
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={fetchStudents} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Sincronizar
            </Button>
            <Dialog open={isFormOpen} onOpenChange={(open) => !open && closeForm()}>
                <DialogTrigger asChild>
                    <Button onClick={() => setIsFormOpen(true)}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Registrar Alumno
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <StudentForm 
                        key={editingStudent?.matricula || 'new'}
                        onSubmit={handleFormSubmit}
                        onClose={closeForm}
                        comunidades={comunidades}
                        onAddComunidad={handleAddComunidad}
                        onRemoveComunidad={handleRemoveComunidad}
                        initialData={editingStudent}
                    />
                </DialogContent>
            </Dialog>
        </div>
      </PageHeader>
      <Card>
        <CardContent className="pt-6">
          <DataTable columns={studentColumns} data={students || []} isLoading={loading} />
        </CardContent>
      </Card>
      
      {enrollmentStudent && (
        <EnrollFingerprintDialog 
            student={enrollmentStudent}
            onClose={handleCloseEnrollDialog}
        />
      )}

      <AlertDialog open={!!studentToDelete} onOpenChange={(open) => !open && setStudentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el perfil de <strong>{studentToDelete?.nombre}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setStudentToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteStudent}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
