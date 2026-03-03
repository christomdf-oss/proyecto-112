import type { Student, Attendance, NotificationLog } from './types';

// Mock data generation
const firstNames = ['Mateo', 'Sofía', 'Santiago', 'Valentina', 'Sebastián', 'Isabella', 'Leonardo', 'Camila', 'Emiliano', 'Valeria', 'Daniel', 'Mariana', 'Javier', 'Gabriela', 'Diego', 'Luciana', 'Nicolás', 'Regina', 'Matías', 'Ximena'];
const lastNames = ['García', 'Rodríguez', 'González', 'Hernández', 'López', 'Martínez', 'Pérez', 'Sánchez', 'Ramírez', 'Flores', 'Gomez', 'Diaz', 'Vargas', 'Rojas', 'Mendoza', 'Castillo'];
const groups = ['101', '102', '103', '104', '201', '202', '203', '301', '302', '303'];


const students: Student[] = Array.from({ length: 280 }, (_, i) => {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName1 = lastNames[Math.floor(Math.random() * lastNames.length)];
  const lastName2 = lastNames[Math.floor(Math.random() * lastNames.length)];
  const grupo = groups[Math.floor(Math.random() * groups.length)];
  const year = new Date().getFullYear().toString().slice(-2);
  // Ensure unique matricula
  const randomDigits = String(1000 + i).padStart(4, '0');

  return {
    matricula: `${year}${grupo}${randomDigits}`,
    nombre: `${firstName} ${lastName1} ${lastName2}`,
    telefono_tutor: `+1-555-${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`,
    grupo,
    fingerprintRegistered: Math.random() > 0.1, // 90% have fingerprints
  };
});

const attendance: Attendance[] = [];
const notificationLogs: NotificationLog[] = [];

students.forEach(student => {
  for (let day = 0; day < 60; day++) { // Generate data for the last 60 days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    today.setDate(today.getDate() - day);
    
    // Skip weekends
    const dayOfWeek = today.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    let lastType: 'entrada' | 'salida' = 'salida';
    
    if (Math.random() > 0.15) { // 85% chance to have an entry record
      const entryTime = new Date(today);
      const hour = 7 + Math.floor(Math.random() * 2); // 7 AM or 8 AM
      const minute = Math.floor(Math.random() * 60);
      const second = Math.floor(Math.random() * 60);
      entryTime.setHours(hour, minute, second);

      if (entryTime < new Date()) {
        attendance.push({
          id: `att_${attendance.length + 1}`,
          studentId: student.matricula,
          studentName: student.nombre,
          timestamp: entryTime,
          type: 'entrada',
        });
        lastType = 'entrada';

        if (day < 5) { // Only generate recent notifications
            notificationLogs.push({
                id: `notif_${notificationLogs.length + 1}`,
                studentName: student.nombre,
                eventType: 'entrada',
                timestamp: entryTime,
                status: Math.random() > 0.05 ? 'success' : 'failed',
                reason: Math.random() > 0.05 ? undefined : 'TIEMPO_DE_ESPERA_API'
            });
        }
      }
    }

    if (lastType === 'entrada' && Math.random() > 0.1) { // 90% chance to check out
      const exitTime = new Date(today);
      const hour = 14 + Math.floor(Math.random() * 2); // 2 PM or 3 PM
      const minute = Math.floor(Math.random() * 60);
      const second = Math.floor(Math.random() * 60);
      exitTime.setHours(hour, minute, second);

      if (exitTime < new Date() && exitTime > (attendance[attendance.length - 1]?.timestamp || new Date(0))) {
        attendance.push({
          id: `att_${attendance.length + 1}`,
          studentId: student.matricula,
          studentName: student.nombre,
          timestamp: exitTime,
          type: 'salida',
        });
        lastType = 'salida';
        
        if (day < 5) {
            notificationLogs.push({
                id: `notif_${notificationLogs.length + 1}`,
                studentName: student.nombre,
                eventType: 'salida',
                timestamp: exitTime,
                status: 'success'
            });
        }
      }
    }
  }
});

attendance.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
notificationLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

export const getStudents = (): Student[] => students;
export const getAttendance = (): Attendance[] => attendance;
export const getNotificationLogs = (): NotificationLog[] => notificationLogs;
