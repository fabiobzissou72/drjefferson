// Configuração dos planos do Dr. Jefferson

export const PLAN_TYPES = {
  trimestral_misto: {
    id: 'trimestral_misto',
    label: 'Plano Misto Trimestral',
    description: '1 consulta presencial + 2 consultas online',
    price: 1097.00,
    consultations: 3,
    durationMonths: 3,
    consultationTypes: [
      { order: 1, mode: 'presencial', durationMinutes: 90, label: '1ª Consulta (Presencial)' },
      { order: 2, mode: 'online', durationMinutes: 30, label: '2ª Consulta (Online)' },
      { order: 3, mode: 'online', durationMinutes: 30, label: '3ª Consulta (Online)' }
    ]
  },
  trimestral_presencial: {
    id: 'trimestral_presencial',
    label: 'Plano Presencial Trimestral',
    description: '3 consultas presenciais',
    price: 1297.00,
    consultations: 3,
    durationMonths: 3,
    consultationTypes: [
      { order: 1, mode: 'presencial', durationMinutes: 90, label: '1ª Consulta (Presencial)' },
      { order: 2, mode: 'presencial', durationMinutes: 60, label: '2ª Consulta (Presencial)' },
      { order: 3, mode: 'presencial', durationMinutes: 60, label: '3ª Consulta (Presencial)' }
    ]
  },
  personalizada_presencial: {
    id: 'personalizada_presencial',
    label: 'Consulta Personalizada Presencial',
    description: 'Consulta única presencial',
    price: 697.00,
    consultations: 1,
    durationMonths: 0,
    consultationTypes: [
      { order: 1, mode: 'presencial', durationMinutes: 90, label: 'Consulta Única (Presencial)' }
    ]
  },
  personalizada_online: {
    id: 'personalizada_online',
    label: 'Consulta Personalizada Online',
    description: 'Consulta única online',
    price: 597.00,
    consultations: 1,
    durationMonths: 0,
    consultationTypes: [
      { order: 1, mode: 'online', durationMinutes: 90, label: 'Consulta Única (Online)' }
    ]
  }
}

export const CITIES = [
  { value: 'Parnaíba', label: 'Parnaíba' },
  { value: 'Teresina', label: 'Teresina' }
]

export const formatPlanPrice = (price) => {
  return price.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  })
}

export const getPlanDetails = (planType) => {
  return PLAN_TYPES[planType] || null
}

export const getAllPlans = () => {
  return Object.values(PLAN_TYPES)
}

export const getPlanLabel = (planType) => {
  const plan = PLAN_TYPES[planType]
  return plan ? plan.label : planType
}

export const getPlanPrice = (planType) => {
  const plan = PLAN_TYPES[planType]
  return plan ? plan.price : 0
}

/**
 * Calcula as 3 datas de consulta baseado na data de início
 * @param {string} startDate - Data de início no formato YYYY-MM-DD
 * @returns {Object} Objeto com as 3 datas de consulta
 */
export const calculateConsultationDates = (startDate) => {
  if (!startDate) {
    return {
      consultation1Date: null,
      consultation2Date: null,
      consultation3Date: null
    }
  }

  const start = new Date(startDate + 'T00:00:00')
  
  // 1ª consulta: data de início
  const date1 = new Date(start)
  
  // 2ª consulta: 30 dias após a primeira
  const date2 = new Date(start)
  date2.setDate(date2.getDate() + 30)
  
  // 3ª consulta: 60 dias após a primeira (30 dias após a segunda)
  const date3 = new Date(start)
  date3.setDate(date3.getDate() + 60)

  const formatDate = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  return {
    consultation1Date: formatDate(date1),
    consultation2Date: formatDate(date2),
    consultation3Date: formatDate(date3)
  }
}

/**
 * Verifica o status das datas de consulta em relação à data atual
 * @param {string} consultationDate - Data da consulta no formato YYYY-MM-DD
 * @returns {string} 'upcoming' | 'overdue' | 'completed' | 'pending'
 */
export const getConsultationDateStatus = (consultationDate) => {
  if (!consultationDate) return 'pending'

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const consultation = new Date(consultationDate + 'T00:00:00')
  consultation.setHours(0, 0, 0, 0)
  
  const diffTime = consultation - today
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return 'overdue' // Passou da data
  } else if (diffDays <= 7) {
    return 'upcoming' // Próxima (7 dias ou menos)
  } else {
    return 'scheduled' // Agendada (mais de 7 dias)
  }
}

/**
 * Retorna a cor do badge baseado no status da data
 */
export const getDateStatusColor = (status) => {
  const colors = {
    overdue: '#ef4444', // vermelho
    upcoming: '#f59e0b', // laranja
    scheduled: '#10b981', // verde
    pending: '#6b7280' // cinza
  }
  return colors[status] || colors.pending
}

/**
 * Retorna o label do status da data
 */
export const getDateStatusLabel = (status) => {
  const labels = {
    overdue: 'Atrasada',
    upcoming: 'Próxima',
    scheduled: 'Agendada',
    pending: 'Pendente'
  }
  return labels[status] || 'Pendente'
}

/**
 * Formata data para exibição (DD/MM/YYYY)
 */
export const formatDateDisplay = (dateString) => {
  if (!dateString) return '-'
  
  const date = new Date(dateString + 'T00:00:00')
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  
  return `${day}/${month}/${year}`
}
