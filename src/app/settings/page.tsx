'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { KeyRound } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-2">
      <PageHeader
        title="Configuración"
        description="Gestiona la configuración de la aplicación y las integraciones."
      />
      <Card>
        <CardHeader>
          <CardTitle>Administración de Claves de API</CardTitle>
          <CardDescription>
            En esta sección se podrán configurar las claves para servicios externos como Twilio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40 text-center text-muted-foreground border-2 border-dashed rounded-lg">
            <div className="flex flex-col items-center gap-2">
              <KeyRound className="h-8 w-8" />
              <span>Próximamente: Gestión de API Keys</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
