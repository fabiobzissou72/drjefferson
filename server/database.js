import { supabaseAdmin } from './supabase.js';

export const defaultConsultationTypes = [
  {
    id: 'first-visit',
    value: 'first',
    label: 'Primeira vez',
    mode: 'mixed',
    durationMinutes: 90,
    price: 0,
    active: true
  },
  {
    id: 'second-visit',
    value: 'checkup',
    label: 'Segunda vez',
    mode: 'presential',
    durationMinutes: 60,
    price: 0,
    active: true
  },
  {
    id: 'returning-client',
    value: 'return',
    label: 'Retorno se ja foi cliente',
    mode: 'presential',
    durationMinutes: 60,
    price: 0,
    active: true
  },
  {
    id: 'online-return',
    value: 'emergency',
    label: 'Retorno online',
    mode: 'online',
    durationMinutes: 30,
    price: 0,
    active: true
  }
];

export function mapPatientRow(row) {
  return {
    id: row.id,
    name: row.name,
    cpf: row.cpf,
    phone: row.phone,
    email: row.email || undefined,
    birthDate: row.birth_date || undefined,
    notes: row.notes || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function mapAppointmentRow(row) {
  return {
    id: row.id,
    patientId: row.patient_id,
    date: row.date,
    time: row.time?.slice(0, 5) || row.time,
    type: row.type,
    status: row.status,
    notes: row.notes || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function mapPatientInput(input) {
  return {
    name: input.name,
    cpf: input.cpf,
    phone: input.phone,
    email: input.email ?? null,
    birth_date: input.birthDate ?? null,
    notes: input.notes ?? null,
    updated_at: new Date().toISOString()
  };
}

export async function getConsultationTypesSetting() {
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

  return value;
}

export async function setConsultationTypesSetting(types) {
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
