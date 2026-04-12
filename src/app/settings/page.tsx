'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { KeyRound, Smartphone, Building } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
    const { toast } = useToast();

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real application, you would save these values to a secure backend or environment variables.
        // For this prototype, we'll just show a success message.
        toast({
            title: 'Configuración Guardada',
            description: 'Tus claves de API han sido guardadas (simulación).',
        });
    };

  return (
    <div className="container mx-auto py-2">
      <PageHeader
        title="Configuración"
        description="Gestiona la configuración de la aplicación y las integraciones."
      />
      <form onSubmit={handleSave}>
        <Card>
            <CardHeader>
            <CardTitle>Integración con Twilio (para WhatsApp)</CardTitle>
            <CardDescription>
                Ingresa tus credenciales de Twilio para activar el envío de notificaciones por WhatsApp.
                Puedes encontrarlas en la consola de tu cuenta de Twilio.
            </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="twilio-sid">
                    <Building className="inline-block mr-2 h-4 w-4" />
                    Twilio Account SID
                </Label>
                <Input id="twilio-sid" placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="twilio-auth-token">
                    <KeyRound className="inline-block mr-2 h-4 w-4" />
                    Twilio Auth Token
                </Label>
                <Input id="twilio-auth-token" type="password" placeholder="••••••••••••••••••••••••" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="twilio-phone">
                    <Smartphone className="inline-block mr-2 h-4 w-4" />
                    Número de Teléfono de Twilio (WhatsApp)
                </Label>
                <Input id="twilio-phone" placeholder="whatsapp:+14155238886" />
                <p className="text-xs text-muted-foreground pt-1">
                    Debe ser el número de tu sandbox de Twilio o un número que hayas comprado, en formato E.164.
                </p>
            </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
                <Button type="submit">Guardar Cambios</Button>
            </CardFooter>
        </Card>
      </form>
    </div>
  );
}
