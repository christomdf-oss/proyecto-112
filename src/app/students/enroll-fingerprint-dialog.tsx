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
import { Fingerprint, Monitor, Copy, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EnrollFingerprintDialogProps {
  student: Student;
  onClose: () => void;
}

export function EnrollFingerprintDialog({ student, onClose }: EnrollFingerprintDialogProps) {
  const { toast } = useToast();

  const handleCopyMatricula = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(student.matricula);
      toast({ 
        title: 'Matrícula Copiada', 
        description: 'Pégala en la aplicación de escritorio para comenzar.' 
      });
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Fingerprint className="h-6 w-6" />
            Registro de Huella Digital
          </DialogTitle>
          <DialogDescription>
            Sigue estos pasos para vincular la huella de <strong>{student.nombre}</strong>.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6 space-y-6">
          <div className="relative flex justify-center">
            <div className="absolute inset-0 flex items-center justify-center animate-ping opacity-20">
              <div className="h-20 w-20 rounded-full bg-primary" />
            </div>
            <div className="relative rounded-full bg-primary/10 p-4">
              <Fingerprint className="h-12 w-12 text-primary" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">1</div>
              <p className="text-sm">Abre la aplicación <strong>"Sistema de Registro - COBACAM"</strong> en el escritorio de esta PC.</p>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">2</div>
              <div className="space-y-2 flex-1">
                <p className="text-sm">Copia y pega la matrícula del alumno en el programa:</p>
                <div className="flex items-center space-x-2 rounded-md bg-muted p-2 border border-dashed border-primary/30">
                  <code className="text-base font-mono font-bold text-primary flex-1 text-center">{student.matricula}</code>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10" onClick={handleCopyMatricula}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">3</div>
              <p className="text-sm">Presiona <strong>"Iniciar Registro"</strong> en la PC y coloca el dedo 3 veces cuando el sensor encienda.</p>
            </div>
          </div>

          <div className="rounded-lg bg-success/10 p-3 border border-success/20 flex gap-3 items-center">
            <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
            <p className="text-xs text-success-foreground">
              Al terminar, haz clic en <strong>"Sincronizar"</strong> en la tabla principal para ver el cambio.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" onClick={onClose} className="w-full">
            Entendido, ir al programa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
