'use server';
/**
 * @fileOverview A server action for sending emails using the local Nodemailer API route.
 * - sendAttendanceEmail - A server action that sends a notification email to a tutor.
 */
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { AttendanceEmailInput } from '@/lib/types';

export async function sendAttendanceEmail(input: AttendanceEmailInput) {
  const eventTime = format(input.eventTimestamp, 'p', { locale: es });
  const body = `Estimado padre de familia, le informamos que el alumno ${input.studentName} ha registrado su ${input.eventType} el día de hoy a las ${eventTime}.`;

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
    const response = await fetch(`${baseUrl}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombreAlumno: input.studentName,
        correoTutor: input.to,
        hora: eventTime,
        tipo: input.eventType,
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ error: 'Error desconocido' }));
      console.error(`Error al enviar correo a ${input.to}:`, errorBody);
      return { success: false, error: errorBody.error || 'No se pudo enviar el correo.' };
    }

    const result = await response.json();
    if (!result.success) {
      console.error(`API local envió error para ${input.to}:`, result);
      return { success: false, error: result.error || 'La API de correo devolvió un error.' };
    }

    return { success: true };
  } catch (e) {
    const error = e as Error;
    console.error('Fallo general al enviar correo:', error);
    return { success: false, error: error.message };
  }
}
