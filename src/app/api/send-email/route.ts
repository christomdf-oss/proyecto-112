import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { nombreAlumno, correoTutor, hora, tipo } = await request.json();

    // Configurar el transporte de Gmail con variables de entorno
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const esEntrada = tipo.toLowerCase() === 'entrada';
    const accion = esEntrada ? 'ingresó al' : 'salió del';

    // Opciones y diseño del correo (Colores COBACAM #722F37)
    const mailOptions = {
      from: `"Control de Asistencia COBACAM" <${process.env.GMAIL_USER}>`,
      to: correoTutor,
      subject: `Notificación de Asistencia: ${nombreAlumno} - COBACAM`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #722F37; color: white; padding: 20px; text-align: center;">
            <h2 style="margin: 0; font-size: 20px;">COBACAM Plantel 10</h2>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Control de Entrada y Salida</p>
          </div>
          <div style="padding: 20px; color: #333333; line-height: 1.6;">
            <p>Estimado padre de familia / tutor,</p>
            <p>Le informamos que el alumno <strong>${nombreAlumno}</strong> ${accion} plantel educativo.</p>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr style="background-color: #f9f9f9;">
                <td style="padding: 10px; border: 1px solid #dddddd; font-weight: bold; width: 40%;">Evento:</td>
                <td style="padding: 10px; border: 1px solid #dddddd; color: ${esEntrada ? '#2e7d32' : '#ef6c00'}; font-weight: bold;">${tipo.toUpperCase()}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #dddddd; font-weight: bold;">Hora de Registro:</td>
                <td style="padding: 10px; border: 1px solid #dddddd;">${hora}</td>
              </tr>
            </table>
            
            <p style="font-size: 12px; color: #777777; text-align: center; margin-top: 30px; border-top: 1px solid #eeeeee; padding-top: 15px;">
              Este es un mensaje automático generado por el sistema de asistencia biométrica de COBACAM Plantel 10 Chicbul.
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return NextResponse.json({ success: true, message: 'Correo enviado correctamente' });
  } catch (error: any) {
    console.error('Error al enviar correo:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
