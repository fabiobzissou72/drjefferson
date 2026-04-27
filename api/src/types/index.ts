export type City = 'Parnaíba' | 'Teresina';
export type PlanType = 'trimestral_misto' | 'trimestral_presencial' | 'personalizada_presencial' | 'personalizada_online';

export interface Patient {
  id: string;
  name: string;
  cpf: string;
  phone: string;
  email?: string;
  birthDate?: string;
  notes?: string;
  city?: City;
  planType?: PlanType;
  planStartDate?: string;
  consultation1Date?: string;
  consultation2Date?: string;
  consultation3Date?: string;
  protocoloMonjaro?: boolean;
  observations?: string;
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
  city?: City;
  planType?: PlanType;
  planStartDate?: string;
  consultation1Date?: string;
  consultation2Date?: string;
  consultation3Date?: string;
  protocoloMonjaro?: boolean;
  observations?: string;
}

export interface PatientUpdateInput {
  name?: string;
  cpf?: string;
  phone?: string;
  email?: string;
  birthDate?: string;
  notes?: string;
  city?: City;
  planType?: PlanType;
  planStartDate?: string;
  consultation1Date?: string;
  consultation2Date?: string;
  consultation3Date?: string;
  protocoloMonjaro?: boolean;
  observations?: string;
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'missed' | 'cancelled';
export type AppointmentType = 'first' | 'checkup' | 'return' | 'emergency';
export type ConsultationMode = 'presential' | 'online' | 'mixed';

export interface PlanTypeConfig {
  id: PlanType;
  label: string;
  description: string;
  price: number;
  consultations: number;
  durationMonths: number;
  consultationTypes: {
    order: number;
    mode: 'online' | 'presencial';
    durationMinutes: number;
  }[];
}

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
  consultationMode?: 'online' | 'presencial';
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
  consultationMode?: 'online' | 'presencial';
  notes?: string;
}

export interface AppointmentUpdateInput {
  patientId?: string;
  date?: string;
  time?: string;
  type?: AppointmentType;
  consultationMode?: 'online' | 'presencial';
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
