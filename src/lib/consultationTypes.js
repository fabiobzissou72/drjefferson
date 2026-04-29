const STORAGE_KEY = 'drjefferson_consultation_types_v2'
const DEFAULT_API_BASE_URL = import.meta.env.DEV ? 'http://localhost:3005/api' : '/api'
const API_BASE_URL = (import.meta.env.VITE_API_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '')
const CONSULTATION_TYPES_API_URL = import.meta.env.VITE_CONSULTATION_TYPES_API_URL || `${API_BASE_URL}/consultation-types`

const LEGACY_CONSULTATION_TYPES = {
  first: {
    label: 'Primeira vez',
    mode: 'mixed',
    durationMinutes: 90,
    price: 0,
    active: true
  },
  checkup: {
    label: 'Retorno Presencial',
    mode: 'presential',
    durationMinutes: 60,
    price: 0,
    active: true
  },
  return: {
    label: 'Retorno Presencial',
    mode: 'presential',
    durationMinutes: 60,
    price: 0,
    active: true
  },
  emergency: {
    label: 'Retorno Online',
    mode: 'online',
    durationMinutes: 30,
    price: 0,
    active: true
  }
}

export const DEFAULT_CONSULTATION_TYPES = [
  {
    id: 'plano-misto',
    value: 'first',
    label: 'Plano Misto Trimestral',
    mode: 'mixed',
    durationMinutes: 90,
    price: 1097,
    active: true
  },
  {
    id: 'plano-presencial',
    value: 'checkup',
    label: 'Plano Presencial Trimestral',
    mode: 'presential',
    durationMinutes: 90,
    price: 1297,
    active: true
  },
  {
    id: 'consulta-personalizada-presencial',
    value: 'return',
    label: 'Consulta Personalizada Presencial',
    mode: 'presential',
    durationMinutes: 90,
    price: 697,
    active: true
  },
  {
    id: 'consulta-personalizada-online',
    value: 'emergency',
    label: 'Consulta Personalizada Online',
    mode: 'online',
    durationMinutes: 60,
    price: 597,
    active: true
  }
]

const slugify = (value = '') => {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const toConsultationPriceNumber = (value = 0) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }

  if (typeof value !== 'string') {
    return 0
  }

  const normalized = value
    .replace(/[^\d,.-]/g, '')
    .replace(/\.(?=\d{3}(\D|$))/g, '')
    .replace(',', '.')
    .trim()

  const numericValue = Number(normalized)
  return Number.isFinite(numericValue) ? numericValue : 0
}

export const formatConsultationPrice = (price = 0) => {
  const numericPrice = toConsultationPriceNumber(price)
  return numericPrice.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  })
}

export const formatConsultationDuration = (durationMinutes = 60) => {
  const minutes = Number(durationMinutes || 0)

  if (minutes <= 0) {
    return '0 min'
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (hours > 0 && remainingMinutes > 0) {
    return `${hours}h${String(remainingMinutes).padStart(2, '0')}`
  }

  if (hours > 0) {
    return `${hours}h`
  }

  return `${remainingMinutes} min`
}

export const getConsultationModeLabel = (mode = 'presential') => {
  if (mode === 'online') {
    return 'Online'
  }

  if (mode === 'mixed') {
    return 'Misto'
  }

  return 'Presencial'
}

export const normalizeConsultationType = (type, index = 0) => {
  const fallback = LEGACY_CONSULTATION_TYPES[type?.value] || {}
  const label = (type?.label || fallback.label || `Consulta ${index + 1}`).trim()
  const rawMode = type?.mode || fallback.mode || 'presential'
  const mode = ['online', 'mixed', 'presential'].includes(rawMode) ? rawMode : 'presential'
  const rawValue = type?.value || slugify(label) || `consulta-${index + 1}`
  const stableValue = rawValue.trim()

  return {
    id: type?.id || stableValue,
    value: stableValue,
    label,
    mode,
    durationMinutes: Number(type?.durationMinutes ?? fallback.durationMinutes ?? 60),
    price: toConsultationPriceNumber(type?.price ?? fallback.price ?? 0),
    active: type?.active !== false
  }
}

export const loadStoredConsultationTypes = () => {
  if (typeof window === 'undefined') {
    return DEFAULT_CONSULTATION_TYPES
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return DEFAULT_CONSULTATION_TYPES
    }

    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return DEFAULT_CONSULTATION_TYPES
    }

    return parsed.map(normalizeConsultationType)
  } catch (error) {
    console.error('Error loading consultation types:', error)
    return DEFAULT_CONSULTATION_TYPES
  }
}

export const persistConsultationTypes = (types) => {
  const normalizedTypes = (types || []).map(normalizeConsultationType)

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedTypes))
  }

  return normalizedTypes
}

export const fetchConsultationTypes = async () => {
  try {
    const response = await fetch(CONSULTATION_TYPES_API_URL)

    if (!response.ok) {
      throw new Error(`Consultation types API error: ${response.status}`)
    }

    const payload = await response.json()
    const apiTypes = Array.isArray(payload?.data) ? payload.data : payload

    if (!Array.isArray(apiTypes) || apiTypes.length === 0) {
      return loadStoredConsultationTypes()
    }

    return persistConsultationTypes(apiTypes)
  } catch (error) {
    console.warn('Falling back to local consultation types:', error)
    return loadStoredConsultationTypes()
  }
}

export const saveConsultationTypesToApi = async (types, token) => {
  const normalizedTypes = (types || []).map(normalizeConsultationType)

  const response = await fetch(CONSULTATION_TYPES_API_URL, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(normalizedTypes)
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(payload?.error || payload?.message || `Consultation types API error: ${response.status}`)
  }

  const apiTypes = Array.isArray(payload?.data) ? payload.data : normalizedTypes
  return persistConsultationTypes(apiTypes)
}

export const createConsultationTypeDraft = () => {
  const suffix = Math.random().toString(36).slice(2, 8)
  return {
    id: `consulta-${suffix}`,
    value: `consulta-${suffix}`,
    label: 'Nova consulta',
    mode: 'presential',
    durationMinutes: 60,
    price: 0,
    active: true
  }
}

export const getConsultationTypeDetails = (value, types = DEFAULT_CONSULTATION_TYPES) => {
  const normalizedTypes = (types || []).map(normalizeConsultationType)
  const fromConfig = normalizedTypes.find((type) => type.value === value)

  if (fromConfig) {
    return fromConfig
  }

  if (LEGACY_CONSULTATION_TYPES[value]) {
    return normalizeConsultationType({ value, ...LEGACY_CONSULTATION_TYPES[value] })
  }

  return {
    id: value || 'custom',
    value: value || 'custom',
    label: value || 'Consulta',
    mode: 'presential',
    durationMinutes: 60,
    price: 0,
    active: true
  }
}

export const getConsultationDurationByValue = (value, types = DEFAULT_CONSULTATION_TYPES) => {
  return getConsultationTypeDetails(value, types).durationMinutes || 60
}

export const getActiveConsultationTypes = (types = DEFAULT_CONSULTATION_TYPES) => {
  return (types || []).map(normalizeConsultationType).filter((type) => type.active)
}

export { STORAGE_KEY as CONSULTATION_TYPES_STORAGE_KEY }
