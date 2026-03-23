export const BLOCKED_PATIENT_NAME = 'Agenda Bloqueada'
export const BLOCKED_PATIENT_EMAIL = 'agenda.bloqueada@drjefferson.local'
export const BLOCKED_APPOINTMENT_PREFIX = '[BLOCKED_SLOT]'
export const BLOCKED_APPOINTMENT_TYPE = 'return'

export const isBlockedPatient = (patient) => {
  return patient?.email === BLOCKED_PATIENT_EMAIL || patient?.name === BLOCKED_PATIENT_NAME
}

export const buildBlockedAppointmentNotes = (reason = '') => {
  const normalizedReason = (reason || '').trim()
  return normalizedReason
    ? `${BLOCKED_APPOINTMENT_PREFIX} ${normalizedReason}`
    : BLOCKED_APPOINTMENT_PREFIX
}

export const stripBlockedAppointmentPrefix = (notes = '') => {
  return (notes || '').replace(BLOCKED_APPOINTMENT_PREFIX, '').trim()
}

export const isBlockedAppointment = (appointment, patient = null) => {
  return Boolean(
    appointment?.notes?.startsWith(BLOCKED_APPOINTMENT_PREFIX) ||
    isBlockedPatient(patient)
  )
}

export const getBlockedAppointmentTitle = (appointment) => {
  const reason = stripBlockedAppointmentPrefix(appointment?.notes)
  return reason ? `Bloqueado: ${reason}` : 'Horário bloqueado'
}
