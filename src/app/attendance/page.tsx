'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable } from './data-table';
import { columns } from './columns';
import { getAttendance, getStudents } from '@/lib/data';
import { PageHeader } from '@/components/page-header';

export default function AttendancePage() {
  const attendanceData = React.useMemo(() => getAttendance(), []);
  const studentData = React.useMemo(() => getStudents(), []);

  return (
    <div className="container mx-auto py-2">
      <PageHeader
        title="Historial de Asistencia"
        description="Navega, busca y filtra los registros históricos de asistencia."
      />
      <Card>
        <CardContent className="pt-6">
          <DataTable
            columns={columns}
            data={attendanceData}
            students={studentData}
          />
        </CardContent>
      </Card>
    </div>
  );
}
