import { getConsultationDurationByValue } from './consultationTypes'

export const APPOINTMENT_DURATION_MINUTES = 60

export const normalizeTime = (value) => (value || '').slice(0, 5)

export const toDatabaseTime = (value) => {
  const normalized = normalizeTime(value)
  return normalized ? `${normalized}:00` : ''
}

export const formatDateKey = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const buildAppointmentDateTime = (date, time) => {
  const normalizedTime = toDatabaseTime(time) || '00:00:00'
  return new Date(`${date}T${normalizedTime}`)
}

export const addMinutes = (date, minutes) => {
  const next = new Date(date)
  next.setMinutes(next.getMinutes() + minutes)
  return next
}

export const getAppointmentDurationMinutes = (appointment) => {
  if (appointment?.isBlocked || appointment?.type === 'blocked_slot') {
    return APPOINTMENT_DURATION_MINUTES
  }

  return getConsultationDurationByValue(appointment?.type)
}

export const appointmentsOverlap = (first, second) => {
  if (first.date !== second.date) {
    return false
  }

  const firstStart = buildAppointmentDateTime(first.date, first.time)
  const firstEnd = addMinutes(firstStart, getAppointmentDurationMinutes(first))
  const secondStart = buildAppointmentDateTime(second.date, second.time)
  const secondEnd = addMinutes(secondStart, getAppointmentDurationMinutes(second))

  return firstStart < secondEnd && firstEnd > secondStart
}

export const hasAppointmentConflict = ({ appointment, appointments, ignoreAppointmentId = null }) => {
  return (appointments || []).some(existing => {
    if (existing?.status === 'cancelled') {
      return false
    }

    if (ignoreAppointmentId && existing?.id === ignoreAppointmentId) {
      return false
    }

    return appointmentsOverlap(appointment, existing)
  })
}
