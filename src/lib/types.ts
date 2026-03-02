export type Student = {
  id: string;
  nombre: string;
  id_huella: number;
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
