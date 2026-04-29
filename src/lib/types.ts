import { z } from 'zod';

export type Student = {
  id?: string;
  matricula: string;
  nombre: string;
  telefono_tutor: string;
  correo_tutor: string;
  grupo: string;
  comunidad: string;
  fingerprintTemplate?: string;
};

export type Attendance = {
  id: string;
  studentId: string;
  studentName: string; // Denormalized for easy display
  timestamp: Date;
  type: 'entrada' | 'salida' | 'justificacion' | 'permiso';
  isManual?: boolean;
  reason?: string;
};

export type ProcessedAttendance = {
  studentId: string;
  studentName: string;
  grupo: string;
  entrada: Date | null;
  salida: Date | null;
};

export const AttendanceEmailInputSchema = z.object({
  to: z.string().email(),
  studentName: z.string(),
  eventType: z.enum(['entrada', 'salida']),
  eventTimestamp: z.date(),
});

export type AttendanceEmailInput = z.infer<typeof AttendanceEmailInputSchema>;
