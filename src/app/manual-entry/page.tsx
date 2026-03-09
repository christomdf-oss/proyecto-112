'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getStudents, getAttendance } from '@/lib/data';
import type { Student, Attendance } from '@/lib/types';
import { Search } from 'lucide-react';
import { ManualEntryForm } from './manual-entry-form';
import { useToast } from '@/hooks/use-toast';

export default function ManualEntryPage() {
  const allStudents = React.useMemo(() => getStudents(), []);

  const [filters, setFilters] = React.useState({ name: '', matricula: '' });
  const [searchResults, setSearchResults] = React.useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = React.useState<Student | null>(null);
  const [searchPerformed, setSearchPerformed] = React.useState(false);
  const { toast } = useToast();

  const handleSearch = () => {
    setSelectedStudent(null);
    if (!filters.matricula && !filters.name) {
        setSearchResults([]);
        setSearchPerformed(false);
        return;
    }

    let filtered = allStudents;
    if (filters.matricula) {
      filtered = filtered.filter(s => s.matricula.toLowerCase().includes(filters.matricula.toLowerCase()));
    }
    if (filters.name) {
      filtered = filtered.filter(s => s.nombre.toLowerCase().includes(filters.name.toLowerCase()));
    }
    setSearchResults(filtered);
    setSearchPerformed(true);
  };
  
  const handleClear = () => {
    setSelectedStudent(null);
    setSearchResults([]);
    setSearchPerformed(false);
    setFilters({ name: '', matricula: '' });
  }

  const handleManualEntrySubmit = (data: { type: 'entrada' | 'salida', timestamp: Date, reason: string }) => {
    if (!selectedStudent) return;

    const newAttendanceRecord: Attendance = {
      id: `att_manual_${Date.now()}`,
      studentId: selectedStudent.matricula,
      studentName: selectedStudent.nombre,
      timestamp: data.timestamp,
      type: data.type,
      isManual: true,
      reason: data.reason,
    };
    
    const attendanceData = getAttendance();
    attendanceData.push(newAttendanceRecord);
    attendanceData.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    toast({
        title: "Registro Manual Exitoso",
        description: `Se agregó un registro de ${data.type} para ${selectedStudent.nombre}.`,
    });

    setSelectedStudent(null);
    setSearchPerformed(false);
    setSearchResults([]);
    setFilters({ name: '', matricula: '' });
  };

  if (selectedStudent) {
    return (
        <ManualEntryForm 
            student={selectedStudent} 
            onSubmit={handleManualEntrySubmit}
            onBack={() => setSelectedStudent(null)} 
        />
    )
  }

  return (
    <div className="container mx-auto py-2">
      <PageHeader
        title="Registro Manual de Asistencia"
        description="Busca un alumno para añadir un registro de entrada o salida manualmente."
      />
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
            <Input
              placeholder="Buscar por matrícula..."
              value={filters.matricula}
              onChange={(e) => setFilters({ ...filters, matricula: e.target.value })}
            />
            <Input
              placeholder="Buscar por nombre..."
              value={filters.name}
              onChange={(e) => setFilters({ ...filters, name: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 mb-6">
            <Button onClick={handleSearch} className="w-full sm:w-auto">
                <Search className="mr-2 h-4 w-4" />
                Buscar
            </Button>
            {searchPerformed && <Button onClick={handleClear} variant="outline">Limpiar</Button>}
          </div>

          <div>
            {!searchPerformed ? (
                <div className="text-center text-muted-foreground py-10">
                    <p>Utiliza los filtros para encontrar un alumno.</p>
                </div>
            ) : searchResults.length > 0 ? (
                <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Resultados de Búsqueda ({searchResults.length})</h3>
                    <div className="rounded-md border max-h-[60vh] overflow-y-auto">
                        {searchResults.map((student) => (
                          <div
                            key={student.matricula}
                            className="flex items-center justify-between p-4 border-b last:border-b-0 hover:bg-accent cursor-pointer"
                            onClick={() => setSelectedStudent(student)}
                          >
                            <div>
                                <p className="font-medium">{student.nombre}</p>
                                <p className="text-sm text-muted-foreground">Grupo {student.grupo} - {student.comunidad}</p>
                            </div>
                            <div className="text-right text-xs text-muted-foreground">
                                <p>Matrícula: {student.matricula}</p>
                            </div>
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
        </CardContent>
      </Card>
    </div>
  );
}
