'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { KeyRound, Mail, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function SettingsPage() {
    const { toast } = useToast();

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real application, you would save these values to a secure backend or environment variables.
        // For this prototype, we'll just show a success message.
        toast({
            title: 'Configuración Guardada (Simulación)',
            description: 'En un entorno de producción, esta clave se guardaría de forma segura.',
        });
    };

  return (
    <div className="container mx-auto py-2">
      <PageHeader
        title="Configuración de Notificaciones"
        description="Gestiona la integración para el envío de correos electrónicos."
      />
       <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertTitle>Importante: Configuración del Servidor</AlertTitle>
          <AlertDescription>
            Para que el envío de correos funcione, debes añadir tu clave de API de Resend como una variable de entorno en tu servidor. Crea un archivo <code>.env.local</code> en la raíz del proyecto y añade la línea: <code>RESEND_API_KEY=tu_clave_aqui</code>.
          </AlertDescription>
        </Alert>

      <form onSubmit={handleSave}>
        <Card>
            <CardHeader>
            <CardTitle>Integración con Resend</CardTitle>
            <CardDescription>
                Ingresa tu clave de API de Resend para activar el envío de correos.
                Puedes obtener una clave desde el <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="underline">dashboard de Resend</a>.
            </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="resend-api-key">
                    <KeyRound className="inline-block mr-2 h-4 w-4" />
                    Resend API Key
                </Label>
                <Input id="resend-api-key" type="password" placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxx" />
                 <p className="text-xs text-muted-foreground pt-1">
                    La clave solo se usa para esta demostración. El valor real debe configurarse en el servidor.
                </p>
            </div>
             <div className="space-y-2">
                <Label htmlFor="from-email">
                    <Mail className="inline-block mr-2 h-4 w-4" />
                    Correo Remitente (Configurado en el código)
                </Label>
                <Input id="from-email" readOnly value="Sistema de Asistencia <onboarding@resend.dev>" />
                 <p className="text-xs text-muted-foreground pt-1">
                    Resend requiere que el dominio del remitente esté verificado. En el modo de prueba se usa <code>onboarding@resend.dev</code>.
                </p>
            </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
                <Button type="submit">Guardar Cambios (Simulación)</Button>
            </CardFooter>
        </Card>
      </form>
    </div>
  );
}
