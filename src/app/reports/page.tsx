'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getStudents, getAttendance } from '@/lib/data';
import type { Student, Attendance } from '@/lib/types';
import { StudentReportCard } from './student-report-card';
import { Search } from 'lucide-react';

export default function ReportsPage() {
  const allStudents = React.useMemo(() => getStudents(), []);
  const allAttendance = React.useMemo(() => getAttendance(), []);

  const [filters, setFilters] = React.useState({ name: '', group: '', matricula: '', comunidad: '' });
  const [searchResults, setSearchResults] = React.useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = React.useState<Student | null>(null);
  const [searchPerformed, setSearchPerformed] = React.useState(false);

  const handleSearch = () => {
    setSelectedStudent(null);
    if (!filters.matricula && !filters.name && !filters.group && !filters.comunidad) {
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
    if (filters.group) {
      filtered = filtered.filter(s => s.grupo.toLowerCase().includes(filters.group.toLowerCase()));
    }
    if (filters.comunidad) {
        filtered = filtered.filter(s => s.comunidad.toLowerCase().includes(filters.comunidad.toLowerCase()));
    }
    setSearchResults(filtered);
    setSearchPerformed(true);
  };
  
  const handleClear = () => {
    setSelectedStudent(null);
    setSearchResults([]);
    setSearchPerformed(false);
    setFilters({ name: '', group: '', matricula: '', comunidad: '' });
  }

  if (selectedStudent) {
    return (
        <StudentReportCard 
            student={selectedStudent} 
            attendance={allAttendance} 
            onBack={() => setSelectedStudent(null)} 
        />
    )
  }

  return (
    <div className="container mx-auto py-2">
      <PageHeader
        title="Consulta de Reportes"
        description="Busca un alumno por nombre, grupo o matrícula para ver su reporte."
      />
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
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
            <Input
              placeholder="Buscar por grupo..."
              value={filters.group}
              onChange={(e) => setFilters({ ...filters, group: e.target.value })}
            />
             <Input
              placeholder="Buscar por comunidad..."
              value={filters.comunidad}
              onChange={(e) => setFilters({ ...filters, comunidad: e.target.value })}
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
                    <p>Utiliza los filtros para encontrar el reporte de un alumno.</p>
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
