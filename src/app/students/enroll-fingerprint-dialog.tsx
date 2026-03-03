'use client';
import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Student } from '@/lib/types';
import { Fingerprint, CheckCircle2, LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/utils';


interface EnrollFingerprintDialogProps {
  student: Student;
  onSuccess: (matricula: string) => void;
  onClose: () => void;
}

export function EnrollFingerprintDialog({ student, onSuccess, onClose }: EnrollFingerprintDialogProps) {
    const [status, setStatus] = React.useState<'waiting' | 'success' | 'failed'>('waiting');

    React.useEffect(() => {
        if (status === 'waiting') {
            const timer = setTimeout(() => {
                // Simulate a successful fingerprint scan
                setStatus('success');
                onSuccess(student.matricula);
            }, 3000); // 3-second delay to simulate scanning

            return () => clearTimeout(timer);
        }
    }, [status, onSuccess, student.matricula]);
    
    const renderContent = () => {
        switch (status) {
            case 'success':
                return (
                    <>
                        <CheckCircle2 className="h-16 w-16 text-success mx-auto" />
                        <h3 className="text-lg font-semibold text-center mt-4">¡Huella registrada correctamente!</h3>
                        <p className="text-muted-foreground text-center text-sm">El registro de la huella para {student.nombre} se ha completado.</p>
                    </>
                );
            case 'failed':
                 return (
                    <>
                        {/* Placeholder for a failure state */}
                        <h3 className="text-lg font-semibold text-center mt-4 text-destructive">Error en el Registro</h3>
                        <p className="text-muted-foreground text-center text-sm">No se pudo completar el registro de la huella. Por favor, inténtalo de nuevo.</p>
                    </>
                );
            case 'waiting':
            default:
                return (
                    <>
                        <div className="relative w-24 h-24 mx-auto">
                            <Fingerprint className="h-24 w-24 text-primary/30" />
                            <LoaderCircle className="h-8 w-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin" />
                        </div>
                        <h3 className="text-lg font-semibold text-center mt-4">Esperando lectura de huella...</h3>
                        <p className="text-muted-foreground text-center text-sm">Por favor, pide a <strong>{student.nombre}</strong> que coloque su dedo en el lector.</p>
                    </>
                );
        }
    }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registro de Huella Dactilar</DialogTitle>
        </DialogHeader>
        <div className="py-8 flex flex-col items-center justify-center gap-2">
            {renderContent()}
        </div>
        <DialogFooter className="sm:justify-center">
          <Button type="button" onClick={onClose} variant={status === 'success' ? 'default' : 'outline'}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
