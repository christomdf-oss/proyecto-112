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
import { Fingerprint, Terminal, Copy } from 'lucide-react';
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
          <DialogTitle>Registrar Huella para {student.nombre}</DialogTitle>
          <DialogDescription>
            El registro de huellas se realiza desde la Raspberry Pi.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="flex justify-center">
            <Fingerprint className="h-16 w-16 text-primary/80" />
          </div>
          <div className="space-y-2 text-sm text-center text-muted-foreground">
            <p>
              Para registrar la huella de este alumno, necesitarás ejecutar el script de enrolamiento en el dispositivo donde está conectado el sensor (la Raspberry Pi).
            </p>
             <p className="font-semibold text-foreground">
              El script te pedirá la matrícula del alumno.
            </p>
          </div>
          <div className="flex items-center space-x-2 rounded-md bg-muted p-3">
              <Terminal className="h-5 w-5 shrink-0" />
              <code className="text-sm font-semibold text-muted-foreground flex-1">{student.matricula}</code>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopyMatricula}>
                  <Copy className="h-4 w-4" />
              </Button>
          </div>
           <p className="text-xs text-muted-foreground text-center pt-2">
            Una vez que el script confirme el registro, puedes presionar el botón 'Sincronizar' en la página de alumnos para ver el estado actualizado.
          </p>
        </div>
        <DialogFooter className="sm:justify-center">
          <Button type="button" onClick={onClose}>
            Entendido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
