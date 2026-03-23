import { Appointment, AppointmentStatus, ConsultationTypeConfig, Patient } from '@/types';
import { defaultConsultationTypes } from './consultation-types';
import { supabaseAdmin } from './supabase';

type PatientRow = {
  id: string;
  name: string;
  cpf: string;
  phone: string;
  email: string | null;
  birth_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type AppointmentRow = {
  id: string;
  patient_id: string;
  date: string;
  time: string;
  type: Appointment['type'];
  status: AppointmentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export const mapPatientRow = (row: PatientRow): Patient => ({
  id: row.id,
  name: row.name,
  cpf: row.cpf,
  phone: row.phone,
  email: row.email || undefined,
  birthDate: row.birth_date || undefined,
  notes: row.notes || undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export const mapAppointmentRow = (row: AppointmentRow): Appointment => ({
  id: row.id,
  patientId: row.patient_id,
  date: row.date,
  time: row.time?.slice(0, 5) || row.time,
  type: row.type,
  status: row.status,
  notes: row.notes || undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export const mapAppointmentInput = (input: Partial<Appointment>) => ({
  patient_id: input.patientId,
  date: input.date,
  time: input.time,
  type: input.type,
  status: input.status,
  notes: input.notes ?? null,
  updated_at: new Date().toISOString()
});

export const mapPatientInput = (input: Partial<Patient>) => ({
  name: input.name,
  cpf: input.cpf,
  phone: input.phone,
  email: input.email ?? null,
  birth_date: input.birthDate ?? null,
  notes: input.notes ?? null,
  updated_at: new Date().toISOString()
});

export async function getConsultationTypesSetting(): Promise<ConsultationTypeConfig[]> {
  const { data, error } = await supabaseAdmin
    .from('app_settings')
    .select('value')
    .eq('key', 'consultation_types')
    .maybeSingle();

  if (error) {
    throw error;
  }

  const value = data?.value;
  if (!Array.isArray(value) || value.length === 0) {
    return defaultConsultationTypes;
  }

  return value as ConsultationTypeConfig[];
}

export async function setConsultationTypesSetting(types: ConsultationTypeConfig[]) {
  const { error } = await supabaseAdmin
    .from('app_settings')
    .upsert({
      key: 'consultation_types',
      value: types,
      updated_at: new Date().toISOString()
    });

  if (error) {
    throw error;
  }
}
