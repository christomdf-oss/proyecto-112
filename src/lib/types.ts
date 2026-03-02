export type Student = {
  matricula: string;
  nombre: string;
  telefono_tutor: string;
  grupo: string;
};

export type Attendance = {
  id: string;
  studentId: string;
  studentName: string; // Denormalized for easy display
  timestamp: Date;
  type: 'entrada' | 'salida';
};

export type NotificationLog = {
  id:string;
  studentName: string;
  eventType: 'entrada' | 'salida';
  timestamp: Date;
  status: 'success' | 'failed';
  reason?: string;
};

export type ProcessedAttendance = {
  studentId: string;
  studentName: string;
  grupo: string;
  entrada: Date | null;
  salida: Date | null;
};
