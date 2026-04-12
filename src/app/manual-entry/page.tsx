'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { Student, Attendance } from '@/lib/types';
import { Search, PlusCircle, FileText, Phone } from 'lucide-react';
import { ManualEntryForm } from './manual-entry-form';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { isSameDay, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useFirestore } from '@/firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';


type BadgeVariant = 'success' | 'destructive' | 'secondary' | 'outline' | 'default';

const getBadgeProps = (type: Attendance['type']): { variant: BadgeVariant, text: string } => {
    switch (type) {
        case 'entrada':
            return { variant: 'success', text: 'Entrada' };
        case 'salida':
            return { variant: 'destructive', text: 'Salida' };
        case 'justificacion':
            return { variant: 'secondary', text: 'Justificación' };
        case 'permiso':
            return { variant: 'outline', text: 'Permiso' };
        default:
            return { variant: 'default', text: type };
    }
}

export default function ManualEntryPage() {
  const firestore = useFirestore();
  const [allStudents, setAllStudents] = React.useState<Student[]>([]);
  const [attendanceData, setAttendanceData] = React.useState<Attendance[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [filters, setFilters] = React.useState({ name: '', matricula: '' });
  const [searchResults, setSearchResults] = React.useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = React.useState<Student | null>(null);
  const [searchPerformed, setSearchPerformed] = React.useState(false);
  const { toast } = useToast();
  
  const today = new Date();
  
  React.useEffect(() => {
    if (!firestore) return;

    const fetchData = async () => {
        setLoading(true);
        try {
            const studentsQuery = await getDocs(collection(firestore, 'students'));
            const studentsList = studentsQuery.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student)).filter(s => s.matricula && s.nombre);
            setAllStudents(studentsList);

            const attendanceQuery = await getDocs(collection(firestore, 'asistencias'));
            const attendanceList = attendanceQuery.docs.map(doc => {
                 const data = doc.data();
                 for (const key in data) {
                     if (data[key] && typeof data[key].toDate === 'function') {
                         data[key] = data[key].toDate();
                     }
                 }
                 return { id: doc.id, ...data } as Attendance;
            });
            setAttendanceData(attendanceList);

        } catch (error) {
            console.error("Error fetching data for manual entry:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los datos.' });
        } finally {
            setLoading(false);
        }
    };

    fetchData();
}, [firestore, toast]);


  // Logic for Ausentes Hoy
  const absentToday = React.useMemo(() => {
    if (!attendanceData || !allStudents) return [];
    const todaysAttendance = attendanceData.filter((a) =>
      isSameDay(a.timestamp, today) && a.type === 'entrada'
    );
    const presentStudentIds = new Set(todaysAttendance.map(a => a.studentId));
    return allStudents.filter(student => !presentStudentIds.has(student.matricula)).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [allStudents, attendanceData, today]);

  // Logic for Registros Manuales del Día
  const manualEntriesToday = React.useMemo(() => {
    if (!attendanceData) return [];
     return attendanceData.filter(
      (a) => isSameDay(a.timestamp, today) && a.isManual
    ).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [attendanceData, today]);


  const handleSearch = () => {
    setSelectedStudent(null);
    if (!filters.matricula && !filters.name) {
        setSearchResults([]);
        setSearchPerformed(false);
        return;
    }

    const currentStudents = allStudents ?? [];
    let filtered = currentStudents;
    if (filters.matricula) {
      filtered = filtered.filter(s => s.matricula.toLowerCase().includes(filters.matricula.toLowerCase()));
    }
    if (filters.name) {
      filtered = filtered.filter(s => s.nombre.toLowerCase().includes(filters.name.toLowerCase()));
    }
    setSearchResults(filtered);
    setSearchPerformed(true);
  };
  
  const handleClearSearch = () => {
    setSearchResults([]);
    setSearchPerformed(false);
    setFilters({ name: '', matricula: '' });
  }

  const handleManualEntrySubmit = async (data: { type: Attendance['type'], timestamp: Date, reason?: string }) => {
    console.log("Intentando guardar registro manual... Datos recibidos:", data);

    if (!selectedStudent) {
        const errorMsg = "Error: No hay ningún alumno seleccionado.";
        console.error(errorMsg);
        alert(errorMsg);
        return;
    }

    if (!firestore) {
      const errorMsg = "Error de Conexión: La instancia de Firestore no está disponible.";
      console.error(errorMsg);
      alert(errorMsg);
      return;
    }

    const newAttendanceRecord: Omit<Attendance, 'id'> = {
      studentId: selectedStudent.matricula,
      studentName: selectedStudent.nombre,
      timestamp: data.timestamp,
      type: data.type,
      isManual: true,
      reason: data.reason,
    };

    try {
      console.log("Objeto a guardar:", newAttendanceRecord);
      console.log("Colección de destino: 'asistencias'");
      const attendanceCollection = collection(firestore, 'asistencias');
      
      const savePromise = addDoc(attendanceCollection, newAttendanceRecord);
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Tiempo de espera agotado")), 5000)
      );

      const docRef = await Promise.race([savePromise, timeoutPromise]);
      
      console.log("¡Registro manual guardado con éxito! Documento ID:", (docRef as any).id);
      window.alert("¡Registro manual guardado con éxito!");

      toast({
          title: "Registro Manual Exitoso",
          description: `Se agregó un registro de tipo '${data.type}' para ${selectedStudent.nombre}.`,
      });
      setSelectedStudent(null);
      handleClearSearch();
    } catch (error: any) {
      const errorMessage = error.message.includes("Tiempo de espera agotado") 
        ? "Error: Tiempo de espera agotado"
        : `Error al guardar registro manual: ${error.message}`;
        
      console.error("Error detallado al agregar registro manual:", error);
      window.alert(errorMessage);
    }
  };

  if (selectedStudent) {
    return (
        <ManualEntryForm 
            student={selectedStudent} 
            onSubmit={handleManualEntrySubmit}
            onBack={() => {
                setSelectedStudent(null);
                handleClearSearch();
            }} 
        />
    )
  }

  return (
    <div className="container mx-auto py-2">
      <PageHeader
        title="Gestión de Registros Manuales"
        description="Añade registros manuales para los alumnos ausentes o busca uno específico."
      />
       <Card className="mb-6">
        <CardHeader>
            <CardTitle>Búsqueda Específica de Alumno</CardTitle>
            <CardDescription>Usa esta sección si necesitas añadir un registro para un alumno que no está en la lista de ausentes (ej. una salida manual o un permiso).</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
            <Input
              placeholder="Buscar por matrícula..."
              value={filters.matricula}
              onChange={(e) => setFilters({ ...filters, matricula: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Input
              placeholder="Buscar por nombre..."
              value={filters.name}
              onChange={(e) => setFilters({ ...filters, name: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button onClick={handleSearch} className="w-full sm:w-auto" disabled={loading}>
                <Search className="mr-2 h-4 w-4" />
                {loading ? 'Cargando...' : 'Buscar'}
            </Button>
            {(searchPerformed || filters.name || filters.matricula) && <Button onClick={handleClearSearch} variant="outline">Limpiar</Button>}
          </div>

          {searchPerformed && (
             <div className="mt-6">
                {searchResults.length > 0 ? (
                    <div className="space-y-2">
                        <h3 className="text-base font-semibold">Resultados de Búsqueda ({searchResults.length})</h3>
                        <div className="rounded-md border max-h-[40vh] overflow-y-auto">
                            {searchResults.map((student) => (
                              <div
                                key={student.matricula}
                                className="flex items-center justify-between p-3 border-b last:border-b-0"
                              >
                                <div>
                                    <p className="font-medium">{student.nombre}</p>
                                    <p className="text-sm text-muted-foreground">Grupo {student.grupo} - {student.comunidad}</p>
                                </div>
                                <Button size="sm" onClick={() => setSelectedStudent(student)}>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Añadir Registro
                                </Button>
                              </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground py-10">
                        <p>No se encontraron alumnos con los criterios de búsqueda.</p>
                    </div>
                )}
             </div>
          )}
        </CardContent>
      </Card>


      <Tabs defaultValue="ausentes" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="ausentes">Alumnos Ausentes Hoy ({absentToday.length})</TabsTrigger>
                <TabsTrigger value="justificados">Registros Manuales de Hoy ({manualEntriesToday.length})</TabsTrigger>
            </TabsList>
        <TabsContent value="ausentes">
            <Card>
                <CardHeader>
                    <CardTitle>Alumnos Sin Registro de Entrada</CardTitle>
                    <CardDescription>
                        Esta es la lista de alumnos que no han registrado su entrada el día de hoy, {format(today, "d 'de' MMMM", { locale: es })}.
                    </CardDescription>
                </CardHeader>
                <CardContent className="max-h-[60vh] overflow-y-auto">
                     {absentToday.length > 0 ? (
                        <div className="space-y-4">
                            {absentToday.map((student) => (
                            <div key={student.matricula} className="flex items-center gap-4 p-2 rounded-md border">
                                <Avatar className="h-9 w-9 border">
                                    <AvatarFallback>{student.nombre.split(' ').map((n) => n[0]).join('')}</AvatarFallback>
                                </Avatar>
                                <div className="grid gap-0.5 flex-1">
                                    <p className="text-sm font-medium">{student.nombre}</p>
                                    <p className="text-xs text-muted-foreground">Grupo {student.grupo} - {student.comunidad}</p>
                                    <div className="flex items-center text-xs text-muted-foreground gap-2 pt-0.5">
                                        <Phone className="h-3 w-3" />
                                        <span>{student.telefono_tutor}</span>
                                    </div>
                                </div>
                                <Button size="sm" variant="outline" onClick={() => setSelectedStudent(student)}>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Añadir Registro
                                </Button>
                            </div>
                            ))}
                        </div>
                        ) : (
                        <div className="flex items-center justify-center h-40 text-center text-muted-foreground">
                            <p>¡Excelente! Todos los alumnos registraron asistencia hoy.</p>
                        </div>
                        )}
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="justificados">
             <Card>
                <CardHeader>
                    <CardTitle>Justificaciones y Registros Manuales</CardTitle>
                     <CardDescription>
                        Estos son los registros que se han añadido manually el día de hoy.
                    </CardDescription>
                </CardHeader>
                <CardContent className="max-h-[60vh] overflow-y-auto">
                     {manualEntriesToday.length > 0 ? (
                        <div className="space-y-4">
                            {manualEntriesToday.map((item) => {
                              const badgeProps = getBadgeProps(item.type);
                              return (
                                <div key={item.id} className="flex items-start gap-4 p-3 rounded-md border">
                                    <Avatar className="h-9 w-9 border">
                                    <AvatarFallback>
                                        {item.studentName.split(' ').map((n) => n[0]).join('')}
                                    </AvatarFallback>
                                    </Avatar>
                                    <div className="grid gap-1.5 w-full">
                                        <div className="flex justify-between items-center">
                                            <p className="text-sm font-medium leading-none">{item.studentName}</p>
                                            <Badge variant={badgeProps.variant} className="capitalize">
                                              {badgeProps.text}
                                              {item.type !== 'justificacion' && ` @ ${format(item.timestamp, 'p', { locale: es })}`}
                                            </Badge>
                                        </div>
                                        {item.reason && (
                                            <div className="flex items-start text-sm text-muted-foreground gap-2 pt-1">
                                                <FileText className="h-4 w-4 mt-0.5 shrink-0" />
                                                <span>{item.reason}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                              );
                            })}
                        </div>
                        ) : (
                         <div className="flex items-center justify-center h-40 text-center text-muted-foreground">
                            <p>No se han realizado registros manuales hoy.</p>
                        </div>
                        )}
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
