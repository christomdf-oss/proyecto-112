'use client';

import * as React from 'react';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from './data-table';
import { columns } from './columns';
import { getStudents } from '@/lib/data';
import { PageHeader } from '@/components/page-header';

export default function StudentsPage() {
  const data = React.useMemo(() => getStudents(), []);

  return (
    <div className="container mx-auto py-2">
      <PageHeader 
        title="Gestión de Alumnos"
        description="Ver, agregar y gestionar perfiles de alumnos."
      >
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Registrar Alumno
        </Button>
      </PageHeader>
      <Card>
        <CardContent className="pt-6">
          <DataTable columns={columns} data={data} />
        </CardContent>
      </Card>
    </div>
  );
}
