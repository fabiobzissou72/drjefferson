import { getConsultationTypesSetting } from './database.js';

export const APPOINTMENT_TIME_SLOTS = [
  '08:00',
  '08:30',
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
  '17:30',
  '18:00'
];

const DEFAULT_DURATION_BY_TYPE = {
  first: 90,
  checkup: 60,
  return: 60,
  emergency: 30
};

export function normalizeTime(value = '') {
  return value.slice(0, 5);
}

export function toDateTime(date, time) {
  const normalizedTime = normalizeTime(time) || '00:00';
  return new Date(`${date}T${normalizedTime}:00`);
}

export async function getDurationMinutes(type = 'first') {
  try {
    const consultationTypes = await getConsultationTypesSetting();
    const matchedType = consultationTypes.find((item) => item?.value === type);
    if (matchedType?.durationMinutes) {
      return matchedType.durationMinutes;
    }
  } catch {
    // Fallback to defaults when settings are unavailable.
  }

  return DEFAULT_DURATION_BY_TYPE[type] || 60;
}

export async function appointmentsOverlap(first, second) {
  if (first.date !== second.date) {
    return false;
  }

  const firstStart = toDateTime(first.date, first.time);
  const firstEnd = new Date(firstStart.getTime() + (await getDurationMinutes(first.type)) * 60000);
  const secondStart = toDateTime(second.date, second.time);
  const secondEnd = new Date(secondStart.getTime() + (await getDurationMinutes(second.type)) * 60000);

  return firstStart < secondEnd && firstEnd > secondStart;
}

export async function findConflictingAppointments({ appointment, appointments, ignoreAppointmentId = null }) {
  const conflicts = [];

  for (const existing of appointments || []) {
    if (!existing || existing.status === 'cancelled') {
      continue;
    }

    if (ignoreAppointmentId && existing.id === ignoreAppointmentId) {
      continue;
    }

    if (await appointmentsOverlap(appointment, existing)) {
      conflicts.push(existing);
    }
  }

  return conflicts;
}

export async function buildAvailability(date, type, appointments) {
  const durationMinutes = await getDurationMinutes(type);
  const slots = [];

  for (const time of APPOINTMENT_TIME_SLOTS) {
    const conflicts = await findConflictingAppointments({
      appointment: { date, time, type, status: 'pending' },
      appointments
    });

    slots.push({
      time,
      available: conflicts.length === 0,
      conflictCount: conflicts.length,
      conflicts: conflicts.map((item) => ({
        id: item.id,
        time: normalizeTime(item.time),
        type: item.type,
        status: item.status,
        patientId: item.patient_id
      }))
    });
  }

  return {
    date,
    type,
    durationMinutes,
    slots
  };
}
