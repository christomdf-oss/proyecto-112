export type Student = {
  id?: string;
  matricula: string;
  nombre: string;
  telefono_tutor: string;
  grupo: string;
  comunidad: string;
  fingerprintRegistered?: boolean;
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

export type WhatsappQueueItem = {
  id: string;
  studentId: string;
  studentName: string;
  tutorPhone: string;
  eventType: 'entrada' | 'salida';
  timestamp: Date;
  status: 'pendiente' | 'enviado';
};

export type ProcessedAttendance = {
  studentId: string;
  studentName: string;
  grupo: string;
  entrada: Date | null;
  salida: Date | null;
};
