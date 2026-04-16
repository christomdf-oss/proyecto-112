'use server';
/**
 * @fileOverview A server action for sending emails using Resend.
 * - sendAttendanceEmail - A server action that sends a notification email to a tutor.
 */
import { Resend } from 'resend';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { AttendanceEmailInput } from '@/lib/types';

export async function sendAttendanceEmail(input: AttendanceEmailInput) {
  if (!process.env.RESEND_API_KEY) {
    const errorMessage = 'Resend API Key no está configurada en el servidor. No se pudo enviar el correo.';
    console.error(errorMessage);
    // Even if it fails, we don't throw, to avoid breaking the client flow.
    // The client doesn't wait for this response.
    return { success: false, error: errorMessage };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const subject = `Notificación de Asistencia - COBACAM Plantel 10`;
  const eventTime = format(input.eventTimestamp, 'p', { locale: es });
  const body = `Estimado padre de familia, le informamos que el alumno ${input.studentName} ha registrado su ${input.eventType} el día de hoy a las ${eventTime}.`;
  const fromAddress = 'Sistema de Asistencia <onboarding@resend.dev>'; // Resend requires this for free tier.

  try {
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: [input.to],
      subject: subject,
      html: `<p>${body}</p>`,
    });

    if (error) {
      console.error(`Error al enviar correo a ${input.to}:`, error);
      return { success: false, error: error.message };
    }

    console.log(`Correo enviado exitosamente a ${input.to}`, data);
    return { success: true };
  } catch (e) {
    const error = e as Error;
    console.error('Fallo general al enviar correo:', error);
    return { success: false, error: error.message };
  }
}
