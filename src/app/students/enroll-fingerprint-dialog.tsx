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
import { Fingerprint, Copy, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useState } from 'react';

interface EnrollFingerprintDialogProps {
  student: Student;
  onClose: () => void;
}

export function EnrollFingerprintDialog({ student, onClose }: EnrollFingerprintDialogProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isWaiting, setIsWaiting] = useState(false);
  const [statusText, setStatusText] = useState('');

  const handleCopyMatricula = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(student.matricula);
      toast({
        title: 'Matrícula Copiada',
        description: 'Pégala en la aplicación de escritorio para comenzar.',
      });
    }
  };

  const startEnrollment = async () => {
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'No hay conexión a Firestore.' });
      return;
    }

    setIsWaiting(true);
    setStatusText('Por favor, coloque su dedo 3 veces seguidas en el lector ZK9500...');

    try {
      // Payload con los nombres exactos del tipo Student
      const payload = {
        matricula: student.matricula,
        nombre:    student.nombre,
        correo:    student.correo_tutor,  // campo real del tipo Student
      };

      console.log('[ENROLL] Enviando payload:', payload);

      const resp = await fetch('http://localhost:5000/api/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await resp
        .json()
        .catch(() => ({ success: false, error: 'Respuesta inválida del sensor' }));

      if (!resp.ok || !data.success) {
        const errMsg = data.error || 'Error al comunicarse con el sensor';
        setIsWaiting(false);
        setStatusText('');
        toast({ variant: 'destructive', title: 'Error', description: errMsg });
        return;
      }

      const templateB64 = data.template;
      if (!templateB64) {
        setIsWaiting(false);
        setStatusText('');
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'La API no devolvió plantilla válida.',
        });
        return;
      }

      // Guardar plantilla en Firestore y marcar como done
      const studentRef = doc(firestore, 'students', student.matricula);
      await updateDoc(studentRef, {
        fingerprintTemplate: templateB64,
        enrollmentStatus: 'done',
      });

      setIsWaiting(false);
      setStatusText('Huella vinculada con éxito.');
      toast({ title: '¡Huella vinculada con éxito!' });
      setTimeout(() => onClose(), 800);

    } catch (e: any) {
      console.error('Error durante enrolamiento vía API local:', e);
      setIsWaiting(false);
      setStatusText('');
      toast({
        variant: 'destructive',
        title: 'Error',
        description: e.message || 'Error desconocido',
      });
    }
  };

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
          {isWaiting && (
            <div className="rounded-md bg-primary/5 p-3 border border-primary/20 flex items-center gap-3">
              <Fingerprint className="h-5 w-5 text-primary animate-spin" />
              <p className="text-sm">{statusText}</p>
            </div>
          )}

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
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                1
              </div>
              <p className="text-sm">
                Abre la aplicación <strong>"Sistema de Registro - COBACAM"</strong> en el
                escritorio de esta PC.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                2
              </div>
              <div className="space-y-2 flex-1">
                <p className="text-sm">Copia y pega la matrícula del alumno en el programa:</p>
                <div className="flex items-center space-x-2 rounded-md bg-muted p-2 border border-dashed border-primary/30">
                  <code className="text-base font-mono font-bold text-primary flex-1 text-center">
                    {student.matricula}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-primary/10"
                    onClick={handleCopyMatricula}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                3
              </div>
              <p className="text-sm">
                Presiona <strong>"Iniciar Registro"</strong> en la PC y coloca el dedo 3 veces
                cuando el sensor encienda.
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-success/10 p-3 border border-success/20 flex gap-3 items-center">
            <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
            <p className="text-xs text-success-foreground">
              Al terminar, haz clic en <strong>"Sincronizar"</strong> en la tabla principal para
              ver el cambio.
            </p>
          </div>
        </div>

        <DialogFooter>
          <div className="w-full flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCopyMatricula}
              className="flex-1"
            >
              Copiar Matrícula
            </Button>
            <Button
              type="button"
              onClick={startEnrollment}
              className="flex-1"
              disabled={isWaiting}
            >
              Iniciar Registro
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}