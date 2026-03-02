import type { Student, Attendance, NotificationLog } from './types';

// Mock data generation
const firstNames = ['Mateo', 'Sofía', 'Santiago', 'Valentina', 'Sebastián', 'Isabella', 'Leonardo', 'Camila', 'Emiliano', 'Valeria'];
const lastNames = ['García', 'Rodríguez', 'González', 'Hernández', 'López', 'Martínez', 'Pérez', 'Sánchez', 'Ramírez', 'Flores'];
const groups = ['101', '102', '203', '204', '301', '302'];


const students: Student[] = Array.from({ length: 25 }, (_, i) => {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  return {
    id: `student_${i + 1}`,
    nombre: `${firstName} ${lastName}`,
    id_huella: 1000 + i,
    telefono_tutor: `+1-555-${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`,
    grupo: groups[Math.floor(Math.random() * groups.length)],
  };
});

const attendance: Attendance[] = [];
const notificationLogs: NotificationLog[] = [];

students.forEach(student => {
  let lastType: 'entrada' | 'salida' = 'salida';
  for (let day = 0; day < 5; day++) {
    const today = new Date();
    today.setDate(today.getDate() - day);
    
    if (Math.random() > 0.1) { // 90% chance to have attendance
      const entryTime = new Date(today);
      entryTime.setHours(8, Math.floor(Math.random() * 30), Math.floor(Math.random() * 60));
      if (entryTime < new Date()) {
        attendance.push({
          id: `att_${attendance.length + 1}`,
          studentId: student.id,
          studentName: student.nombre,
          timestamp: entryTime,
          type: 'entrada',
        });
        lastType = 'entrada';

        notificationLogs.push({
            id: `notif_${notificationLogs.length + 1}`,
            studentName: student.nombre,
            eventType: 'entrada',
            timestamp: entryTime,
            status: Math.random() > 0.05 ? 'success' : 'failed',
            reason: Math.random() > 0.05 ? undefined : 'TIEMPO_DE_ESPERA_API'
        })
      }
    }

    if (lastType === 'entrada' && Math.random() > 0.2) { // 80% chance to check out
      const exitTime = new Date(today);
      exitTime.setHours(15, Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));
      if (exitTime < new Date()) {
        attendance.push({
          id: `att_${attendance.length + 1}`,
          studentId: student.id,
          studentName: student.nombre,
          timestamp: exitTime,
          type: 'salida',
        });
        lastType = 'salida';

        notificationLogs.push({
            id: `notif_${notificationLogs.length + 1}`,
            studentName: student.nombre,
            eventType: 'salida',
            timestamp: exitTime,
            status: 'success'
        })
      }
    }
  }
});

attendance.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
notificationLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

export const getStudents = (): Student[] => students;
export const getAttendance = (): Attendance[] => attendance;
export const getNotificationLogs = (): NotificationLog[] => notificationLogs;
