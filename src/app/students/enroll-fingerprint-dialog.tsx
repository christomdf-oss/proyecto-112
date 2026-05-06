'use client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Student } from '@/lib/types';
import { Fingerprint, Monitor, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EnrollFingerprintDialogProps {
  student: Student;
  onClose: () => void;
}

export function EnrollFingerprintDialog({ student, onClose }: EnrollFingerprintDialogProps) {
  const { toast } = useToast();

  const handleCopyMatricula = () => {
    navigator.clipboard.writeText(student.matricula);
    toast({ title: 'Copiado', description: 'La matrícula ha sido copiada al portapapeles.' });
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registro de Huella Local</DialogTitle>
          <DialogDescription>
            Sigue estos pasos para vincular la huella de {student.nombre}.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="flex justify-center">
            <Fingerprint className="h-16 w-16 text-primary/80 animate-pulse" />
          </div>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
                <Monitor className="h-5 w-5 text-primary shrink-0" />
                <p>Abre la aplicación <b>"Sistema de Registro - COBACAM"</b> en tu computadora.</p>
            </div>
            <p className="text-center font-medium text-foreground">
              Copia la matrícula abajo y pégala en la aplicación de escritorio:
            </p>
          </div>
          <div className="flex items-center space-x-2 rounded-md bg-muted p-3 border">
              <code className="text-base font-bold text-primary flex-1 text-center">{student.matricula}</code>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopyMatricula}>
                  <Copy className="h-4 w-4" />
              </Button>
          </div>
           <p className="text-xs text-muted-foreground text-center bg-accent/30 p-2 rounded">
            Una vez que la aplicación de escritorio confirme el éxito, presiona <b>"Sincronizar"</b> en esta pantalla para actualizar el estado del alumno.
          </p>
        </div>
        <DialogFooter className="sm:justify-center">
          <Button type="button" onClick={onClose} className="w-full sm:w-auto">
            Entendido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
