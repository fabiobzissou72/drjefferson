export interface Patient {
  id: string;
  name: string;
  cpf: string;
  phone: string;
  email?: string;
  birthDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PatientCreateInput {
  name: string;
  cpf: string;
  phone: string;
  email?: string;
  birthDate?: string;
  notes?: string;
}

export interface PatientUpdateInput {
  name?: string;
  cpf?: string;
  phone?: string;
  email?: string;
  birthDate?: string;
  notes?: string;
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'missed' | 'cancelled';
export type AppointmentType = 'first' | 'checkup' | 'return' | 'emergency';
export type ConsultationMode = 'presential' | 'online' | 'mixed';

export interface ConsultationTypeConfig {
  id: string;
  value: AppointmentType;
  label: string;
  mode: ConsultationMode;
  durationMinutes: number;
  price: number;
  active: boolean;
}

export interface Appointment {
  id: string;
  patientId: string;
  date: string;
  time: string;
  type: AppointmentType;
  status: AppointmentStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  patient?: Patient;
}

export interface AppointmentCreateInput {
  patientId: string;
  date: string;
  time: string;
  type: AppointmentType;
  notes?: string;
}

export interface AppointmentUpdateInput {
  patientId?: string;
  date?: string;
  time?: string;
  type?: AppointmentType;
  notes?: string;
}

export interface StatusUpdateInput {
  status: AppointmentStatus;
}

export interface AdminUser {
  id: string;
  email: string;
  fullName?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
