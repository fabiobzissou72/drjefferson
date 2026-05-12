import { Check, Clock, X, XCircle } from 'lucide-react'

export const appointmentStatusConfig = {
  pending: { label: 'Agendado', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.18)', icon: Clock },
  confirmed: { label: 'Confirmado', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.18)', icon: Check },
  completed: { label: 'Compareceu', color: '#16a34a', bg: 'rgba(22, 163, 74, 0.18)', icon: Check },
  attended: { label: 'Compareceu', color: '#16a34a', bg: 'rgba(22, 163, 74, 0.18)', icon: Check },
  missed: { label: 'Faltou', color: '#dc2626', bg: 'rgba(220, 38, 38, 0.18)', icon: XCircle },
  cancelled: { label: 'Cancelado', color: '#dc2626', bg: 'rgba(220, 38, 38, 0.18)', icon: X }
}

export const getAppointmentStatus = (status) => {
  return appointmentStatusConfig[status] || appointmentStatusConfig.pending
}

export const toDatabaseAppointmentStatus = (status) => {
  if (status === 'attended') {
    return 'completed'
  }

  return status
}

export const getAppointmentCalendarColors = (status, theme = 'dark', date = '') => {
  const today = new Date().toISOString().split('T')[0]
  const isPastPending = status === 'pending' && date && date < today

  if (isPastPending) {
    return {
      backgroundColor: theme === 'light' ? '#e5e7eb' : '#4b5563',
      borderColor: theme === 'light' ? '#9ca3af' : '#6b7280',
      textColor: theme === 'light' ? '#374151' : '#d1d5db'
    }
  }

  const normalizedStatus = getAppointmentStatus(status)

  if (theme === 'light') {
    if (status === 'cancelled' || status === 'missed') {
      return {
        backgroundColor: '#fee2e2',
        borderColor: '#fca5a5',
        textColor: '#991b1b'
      }
    }

    if (status === 'completed' || status === 'attended') {
      return {
        backgroundColor: '#16a34a',
        borderColor: '#15803d',
        textColor: '#ffffff'
      }
    }

    return {
      backgroundColor: '#f59e0b',
      borderColor: '#d97706',
      textColor: '#ffffff'
    }
  }

  return {
    backgroundColor: status === 'cancelled' ? normalizedStatus.bg : normalizedStatus.color,
    borderColor: status === 'cancelled' ? 'transparent' : normalizedStatus.color,
    textColor: '#ffffff'
  }
}
