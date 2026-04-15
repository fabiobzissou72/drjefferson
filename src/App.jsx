import { useCallback, useEffect, createContext, useContext, useReducer, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'
import Header from './components/Header/Header'
import Dashboard from './components/Dashboard/Dashboard'
import BlockedAppointments from './components/BlockedAppointments/BlockedAppointments'
import PatientList from './components/PatientList/PatientList'
import Toast from './components/Toast/Toast'
import { PatientLogin } from './patient-portal'
import AdminLogin from './admin/AdminLogin'
import { ADMIN_API_BASE_URL, clearAdminSession, loadStoredAdminSession, persistAdminSession } from './admin/auth'
import { hasAppointmentConflict, normalizeTime, toDatabaseTime } from './lib/appointmentUtils'
import { toDatabaseAppointmentStatus } from './lib/appointmentStatus'
import {
  DEFAULT_CONSULTATION_TYPES,
  fetchConsultationTypes,
  loadStoredConsultationTypes,
  persistConsultationTypes,
  saveConsultationTypesToApi
} from './lib/consultationTypes'
import {
  BLOCKED_APPOINTMENT_TYPE,
  BLOCKED_PATIENT_EMAIL,
  BLOCKED_PATIENT_NAME,
  buildBlockedAppointmentNotes,
  isBlockedAppointment,
  isBlockedPatient
} from './lib/blockedAppointments'
import './App.css'

const APPOINTMENTS_REFRESH_INTERVAL_MS = 10000
const PATIENT_PORTAL_THEME_KEY = 'drjefferson_patient_theme'
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const LOCAL_ADMIN_EMAIL = 'admin@drjefferson.local'
const LOCAL_ADMIN_PASSWORD = 'Admin@123456'
const LOCAL_ADMIN_TOKEN_PREFIX = 'local-admin-session'
const FORCE_LOCAL_ADMIN_MODE = import.meta.env.VITE_FORCE_LOCAL_ADMIN_MODE === 'true'
  || (!import.meta.env.VITE_API_URL && import.meta.env.DEV)

const AppContext = createContext()

const initialState = {
  patients: [],
  appointments: [],
  consultationTypes: [],
  currentView: 'dashboard',
  toasts: [],
  theme: 'light'
}

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, currentView: action.payload }
    case 'SET_PATIENTS':
      return { ...state, patients: action.payload }
    case 'SET_APPOINTMENTS':
      return { ...state, appointments: action.payload }
    case 'SET_CONSULTATION_TYPES':
      return { ...state, consultationTypes: action.payload }
    case 'ADD_TOAST':
      return { ...state, toasts: [...state.toasts, action.payload] }
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter((toast) => toast.id !== action.payload) }
    case 'SET_THEME':
      return { ...state, theme: action.payload }
    default:
      return state
  }
}

const normalizeApiPatient = (patient) => ({
  ...patient,
  birthDate: patient.birthDate || patient.birth_date || '',
  email: patient.email || '',
  notes: patient.notes || ''
})

const normalizeApiAppointment = (appointment) => ({
  ...appointment,
  patient_id: appointment.patient_id || appointment.patientId,
  patientId: appointment.patientId || appointment.patient_id,
  time: normalizeTime(appointment.time)
})

const createLocalAdminUser = (email = LOCAL_ADMIN_EMAIL) => ({
  id: 'local-admin',
  email,
  fullName: 'Administrador'
})

const isLocalAdminToken = (token = '') => token.startsWith(LOCAL_ADMIN_TOKEN_PREFIX)

const pickFirst = (payload) => {
  if (Array.isArray(payload)) {
    return payload[0] || null
  }

  return payload || null
}

const buildSupabaseHeaders = (headers = {}, includeJson = false) => ({
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  ...(includeJson ? { 'Content-Type': 'application/json' } : {}),
  ...headers
})

const supabaseFetch = async (endpoint, options = {}) => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase nao configurado')
  }

  const { headers = {}, body, ...rest } = options
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint.replace(/^\/+/, '')}`, {
    cache: 'no-store',
    ...rest,
    headers: buildSupabaseHeaders(headers, body !== undefined),
    ...(body !== undefined ? { body: JSON.stringify(body) } : {})
  })

  if (response.status === 204) {
    return null
  }

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(`Supabase error: ${response.status}`)
  }

  return payload
}

const toSupabasePatientPayload = (patient) => ({
  name: patient.name,
  cpf: patient.cpf || '',
  phone: patient.phone || '',
  email: patient.email || '',
  birth_date: patient.birthDate || null,
  notes: patient.notes || null
})

const toSupabaseAppointmentPayload = (appointment) => ({
  patient_id: appointment.patientId || appointment.patient_id,
  date: appointment.date,
  time: toDatabaseTime(appointment.time),
  type: appointment.type,
  status: toDatabaseAppointmentStatus(appointment.status || 'pending'),
  notes: appointment.notes || null
})

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}

function App() {
  const [state, dispatch] = useReducer(appReducer, initialState)
  const [adminToken, setAdminToken] = useState(() => loadStoredAdminSession().token)
  const [adminUser, setAdminUser] = useState(() => loadStoredAdminSession().admin)
  const [adminTokenDetails, setAdminTokenDetails] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')
  const isPatientPortalRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/paciente')
  const useLocalAdminMode = FORCE_LOCAL_ADMIN_MODE || isLocalAdminToken(adminToken)

  const addToast = useCallback((message, type = 'info') => {
    const id = uuidv4()
    dispatch({ type: 'ADD_TOAST', payload: { id, message, type } })
    setTimeout(() => {
      dispatch({ type: 'REMOVE_TOAST', payload: id })
    }, 4000)
  }, [])

  const logoutAdmin = useCallback(() => {
    clearAdminSession()
    setAdminToken('')
    setAdminUser(null)
    setAdminTokenDetails(null)
    dispatch({ type: 'SET_PATIENTS', payload: [] })
    dispatch({ type: 'SET_APPOINTMENTS', payload: [] })
    dispatch({ type: 'SET_VIEW', payload: 'dashboard' })
  }, [])

  const syncAdminSession = useCallback((nextToken, nextAdmin = null, nextTokenDetails = null) => {
    const resolvedAdmin = nextAdmin || adminUser || null
    persistAdminSession(nextToken, resolvedAdmin)
    setAdminToken(nextToken)
    setAdminUser(resolvedAdmin)
    setAdminTokenDetails(nextTokenDetails)
  }, [adminUser])

  const apiFetch = useCallback(async (endpoint, options = {}, tokenOverride = '') => {
    const authToken = tokenOverride || adminToken
    const response = await fetch(`${ADMIN_API_BASE_URL}/${endpoint.replace(/^\/+/, '')}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...options.headers
      }
    })

    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      if (response.status === 401 && !isPatientPortalRoute) {
        logoutAdmin()
        throw new Error('Sessao expirada. Faca login novamente.')
      }

      const errorMessage = payload?.error || payload?.message || `API error: ${response.status}`
      throw new Error(errorMessage)
    }

    return payload
  }, [adminToken, isPatientPortalRoute, logoutAdmin])

  const refreshPatients = useCallback(async (tokenOverride = '') => {
    let patients = []

    if (useLocalAdminMode) {
      const payload = await supabaseFetch('patients?select=*&order=created_at.desc')
      patients = Array.isArray(payload) ? payload.map(normalizeApiPatient) : []
    } else {
      try {
        const payload = await apiFetch('patients?page=1&pageSize=1000', {}, tokenOverride)
        patients = Array.isArray(payload?.data) ? payload.data.map(normalizeApiPatient) : []
      } catch (error) {
        console.warn('Falling back to Supabase patients:', error)
        const payload = await supabaseFetch('patients?select=*&order=created_at.desc')
        patients = Array.isArray(payload) ? payload.map(normalizeApiPatient) : []
      }
    }

    dispatch({ type: 'SET_PATIENTS', payload: patients })
    return patients
  }, [apiFetch, useLocalAdminMode])

  const refreshAppointments = useCallback(async (tokenOverride = '') => {
    let appointments = []

    if (useLocalAdminMode) {
      const payload = await supabaseFetch('appointments?select=*&order=date.asc,time.asc')
      appointments = Array.isArray(payload) ? payload.map(normalizeApiAppointment) : []
    } else {
      try {
        const payload = await apiFetch('appointments', {}, tokenOverride)
        appointments = Array.isArray(payload?.data) ? payload.data.map(normalizeApiAppointment) : []
      } catch (error) {
        console.warn('Falling back to Supabase appointments:', error)
        const payload = await supabaseFetch('appointments?select=*&order=date.asc,time.asc')
        appointments = Array.isArray(payload) ? payload.map(normalizeApiAppointment) : []
      }
    }

    dispatch({ type: 'SET_APPOINTMENTS', payload: appointments })
    return appointments
  }, [apiFetch, useLocalAdminMode])

  const refreshConsultationTypes = useCallback(async () => {
    if (useLocalAdminMode) {
      const localTypes = loadStoredConsultationTypes()
      dispatch({ type: 'SET_CONSULTATION_TYPES', payload: localTypes })
      return localTypes
    }

    const remoteTypes = await fetchConsultationTypes()
    dispatch({ type: 'SET_CONSULTATION_TYPES', payload: remoteTypes })
    return remoteTypes
  }, [useLocalAdminMode])

  const loadAdminTokenDetails = useCallback(async () => {
    if (useLocalAdminMode || !adminToken) {
      setAdminTokenDetails(null)
      return null
    }

    const payload = await apiFetch('admin/token')
    const tokenDetails = payload?.data || null
    setAdminTokenDetails(tokenDetails)
    return tokenDetails
  }, [adminToken, apiFetch, useLocalAdminMode])

  const regenerateAdminToken = useCallback(async () => {
    if (useLocalAdminMode || !adminToken) {
      throw new Error('Token manual indisponivel neste modo de acesso')
    }

    const payload = await apiFetch('admin/token', { method: 'POST' })
    const tokenDetails = payload?.data || null

    if (tokenDetails?.token) {
      syncAdminSession(tokenDetails.token, tokenDetails.admin || adminUser, tokenDetails)
    }

    return tokenDetails
  }, [adminToken, adminUser, apiFetch, syncAdminSession, useLocalAdminMode])

  useEffect(() => {
    dispatch({ type: 'SET_THEME', payload: 'light' })
    localStorage.setItem('drjefferson_theme', 'light')
    const storedConsultationTypes = loadStoredConsultationTypes()
    dispatch({
      type: 'SET_CONSULTATION_TYPES',
      payload: storedConsultationTypes?.length
        ? storedConsultationTypes
        : persistConsultationTypes(DEFAULT_CONSULTATION_TYPES)
    })
  }, [])

  useEffect(() => {
    const patientTheme = localStorage.getItem(PATIENT_PORTAL_THEME_KEY) || 'light'
    const effectiveTheme = isPatientPortalRoute ? patientTheme : state.theme
    document.documentElement.setAttribute('data-theme', effectiveTheme)

    if (!isPatientPortalRoute) {
      localStorage.setItem('drjefferson_theme', state.theme)
    }
  }, [isPatientPortalRoute, state.theme])

  useEffect(() => {
    if (isPatientPortalRoute) {
      setAuthReady(true)
      return
    }

    const bootstrap = async () => {
      if (!adminToken) {
        setAdminTokenDetails(null)
        setAuthReady(true)
        return
      }

      if (isLocalAdminToken(adminToken)) {
        setAdminUser((currentAdmin) => currentAdmin || createLocalAdminUser())
        setAdminTokenDetails(null)
        await refreshConsultationTypes()
        setAuthReady(true)
        return
      }

      if (FORCE_LOCAL_ADMIN_MODE) {
        clearAdminSession()
        setAdminToken('')
        setAdminUser(null)
        setAdminTokenDetails(null)
        setAuthReady(true)
        return
      }

      try {
        const payload = await apiFetch('admin/me', {}, adminToken)
        setAdminUser(payload?.data || null)
        await refreshConsultationTypes()
      } catch {
        clearAdminSession()
        setAdminToken('')
        setAdminUser(null)
        setAdminTokenDetails(null)
      } finally {
        setAuthReady(true)
      }
    }

    void bootstrap()
  }, [adminToken, apiFetch, isPatientPortalRoute, refreshConsultationTypes])

  useEffect(() => {
    if (isPatientPortalRoute || !authReady || !adminToken) {
      return
    }

    async function fetchPatientsData() {
      try {
        await refreshPatients()
      } catch (error) {
        console.error('Error fetching patients:', error)
      }
    }

    void fetchPatientsData()
  }, [adminToken, authReady, isPatientPortalRoute, refreshPatients])

  useEffect(() => {
    if (isPatientPortalRoute || !authReady || !adminToken) {
      return
    }

    async function fetchDoctorData() {
      try {
        await Promise.all([refreshAppointments(), refreshConsultationTypes()])
      } catch (error) {
        console.error('Error fetching doctor data:', error)
      }
    }

    void fetchDoctorData()

    const intervalId = window.setInterval(fetchDoctorData, APPOINTMENTS_REFRESH_INTERVAL_MS)
    const handleWindowFocus = () => void fetchDoctorData()
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void fetchDoctorData()
      }
    }

    window.addEventListener('focus', handleWindowFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener('focus', handleWindowFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [adminToken, authReady, isPatientPortalRoute, refreshAppointments, refreshConsultationTypes])

  const handleAdminLogin = async ({ email, password }) => {
    setLoginLoading(true)
    setLoginError('')

    try {
      const normalizedEmail = String(email || '').trim().toLowerCase()

      if (FORCE_LOCAL_ADMIN_MODE) {
        if (normalizedEmail !== LOCAL_ADMIN_EMAIL || password !== LOCAL_ADMIN_PASSWORD) {
          throw new Error('Email ou senha invalidos')
        }

        const sessionToken = `${LOCAL_ADMIN_TOKEN_PREFIX}-${Date.now()}`
        const sessionAdmin = createLocalAdminUser(normalizedEmail)

        persistAdminSession(sessionToken, sessionAdmin)
        setAdminToken(sessionToken)
        setAdminUser(sessionAdmin)
        setAdminTokenDetails(null)
        await Promise.all([refreshPatients(), refreshAppointments(), refreshConsultationTypes()])
        return
      }

      const payload = await apiFetch('admin/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      })

      const sessionToken = payload?.data?.token || ''
      const sessionAdmin = payload?.data?.admin || null

      if (!sessionToken || !sessionAdmin) {
        throw new Error('Resposta de login invalida')
      }

      syncAdminSession(sessionToken, sessionAdmin, {
        token: sessionToken,
        tokenCreatedAt: payload?.data?.tokenCreatedAt || null,
        admin: sessionAdmin
      })
      await Promise.all([
        refreshPatients(sessionToken),
        refreshAppointments(sessionToken),
        refreshConsultationTypes()
      ])
    } catch (error) {
      setLoginError(error.message || 'Nao foi possivel autenticar')
    } finally {
      setLoginLoading(false)
      setAuthReady(true)
    }
  }

  const saveConsultationTypes = async (types) => {
    try {
      const storedTypes = useLocalAdminMode
        ? persistConsultationTypes(types)
        : await saveConsultationTypesToApi(types, adminToken)
      dispatch({ type: 'SET_CONSULTATION_TYPES', payload: storedTypes })
      addToast('Tipos de consulta atualizados!', 'success')
      return storedTypes
    } catch (error) {
      console.error('Error saving consultation types:', error)
      addToast(error.message || 'Erro ao salvar tipos de consulta', 'error')
      throw error
    }
  }

  const addPatient = async (patient) => {
    try {
      let createdPatient = null

      if (useLocalAdminMode) {
        const payload = await supabaseFetch('patients', {
          method: 'POST',
          headers: { Prefer: 'return=representation' },
          body: toSupabasePatientPayload(patient)
        })
        createdPatient = normalizeApiPatient(pickFirst(payload))
      } else {
        try {
          const payload = await apiFetch('patients', {
            method: 'POST',
            body: JSON.stringify({
              name: patient.name,
              cpf: patient.cpf || '',
              phone: patient.phone || '',
              email: patient.email || '',
              birthDate: patient.birthDate || undefined,
              notes: patient.notes || undefined
            })
          })
          createdPatient = normalizeApiPatient(payload?.data)
        } catch (error) {
          console.warn('Falling back to Supabase patient creation:', error)
          const payload = await supabaseFetch('patients', {
            method: 'POST',
            headers: { Prefer: 'return=representation' },
            body: toSupabasePatientPayload(patient)
          })
          createdPatient = normalizeApiPatient(pickFirst(payload))
        }
      }

      await refreshPatients()
      addToast('Paciente cadastrado com sucesso!', 'success')
      return createdPatient
    } catch (error) {
      console.error('Error adding patient:', error)
      addToast(error.message || 'Erro ao cadastrar paciente', 'error')
      return null
    }
  }

  const updatePatient = async (patient) => {
    try {
      let updatedPatient = null

      if (useLocalAdminMode) {
        const payload = await supabaseFetch(`patients?id=eq.${encodeURIComponent(patient.id)}`, {
          method: 'PATCH',
          headers: { Prefer: 'return=representation' },
          body: toSupabasePatientPayload(patient)
        })
        updatedPatient = normalizeApiPatient(pickFirst(payload))
      } else {
        try {
          const payload = await apiFetch(`patients/${patient.id}`, {
            method: 'PUT',
            body: JSON.stringify({
              name: patient.name,
              cpf: patient.cpf || '',
              phone: patient.phone || '',
              email: patient.email || '',
              birthDate: patient.birthDate || undefined,
              notes: patient.notes || undefined
            })
          })
          updatedPatient = normalizeApiPatient(payload?.data)
        } catch (error) {
          console.warn('Falling back to Supabase patient update:', error)
          const payload = await supabaseFetch(`patients?id=eq.${encodeURIComponent(patient.id)}`, {
            method: 'PATCH',
            headers: { Prefer: 'return=representation' },
            body: toSupabasePatientPayload(patient)
          })
          updatedPatient = normalizeApiPatient(pickFirst(payload))
        }
      }

      await refreshPatients()
      addToast('Dados do paciente atualizados!', 'success')
      return updatedPatient
    } catch (error) {
      console.error('Error updating patient:', error)
      addToast(error.message || 'Erro ao atualizar paciente', 'error')
      return null
    }
  }

  const deletePatient = async (id) => {
    try {
      if (useLocalAdminMode) {
        await supabaseFetch(`patients?id=eq.${encodeURIComponent(id)}`, {
          method: 'DELETE'
        })
      } else {
        try {
          await apiFetch(`patients/${id}`, {
            method: 'DELETE'
          })
        } catch (error) {
          console.warn('Falling back to Supabase patient deletion:', error)
          await supabaseFetch(`patients?id=eq.${encodeURIComponent(id)}`, {
            method: 'DELETE'
          })
        }
      }

      await refreshPatients()
      addToast('Paciente removido', 'info')
    } catch (error) {
      console.error('Error deleting patient:', error)
      addToast(error.message || 'Erro ao remover paciente', 'error')
    }
  }

  const ensureBlockedPatient = async () => {
    const existingStatePatient = (state.patients || []).find(isBlockedPatient)
    if (existingStatePatient) {
      return existingStatePatient
    }

    const createdPatient = await addPatient({
      name: BLOCKED_PATIENT_NAME,
      cpf: '000.000.000-00',
      phone: '(00) 00000-0000',
      email: BLOCKED_PATIENT_EMAIL,
      notes: 'Paciente tecnico para bloqueio manual da agenda'
    })

    return createdPatient
  }

  const addAppointment = async (appointment) => {
    try {
      const blockedPatient = appointment.isBlocked ? await ensureBlockedPatient() : null
      const newAppointment = {
        patientId: blockedPatient?.id || appointment.patientId,
        date: appointment.date,
        time: appointment.time,
        type: appointment.isBlocked ? BLOCKED_APPOINTMENT_TYPE : appointment.type,
        status: toDatabaseAppointmentStatus(appointment.status || 'pending'),
        notes: appointment.isBlocked
          ? buildBlockedAppointmentNotes(appointment.notes)
          : appointment.notes || null
      }

      if (hasAppointmentConflict({
        appointment: { ...newAppointment, patient_id: newAppointment.patientId },
        appointments: state.appointments
      })) {
        addToast('Ja existe um agendamento conflitante nesse intervalo', 'error')
        return null
      }

      let createdAppointment = null

      if (useLocalAdminMode) {
        const payload = await supabaseFetch('appointments', {
          method: 'POST',
          headers: { Prefer: 'return=representation' },
          body: toSupabaseAppointmentPayload(newAppointment)
        })
        createdAppointment = normalizeApiAppointment(pickFirst(payload))
      } else {
        try {
          const payload = await apiFetch('appointments', {
            method: 'POST',
            body: JSON.stringify({
              ...newAppointment,
              time: toDatabaseTime(newAppointment.time)
            })
          })
          createdAppointment = normalizeApiAppointment(payload?.data)
        } catch (error) {
          console.warn('Falling back to Supabase appointment creation:', error)
          const payload = await supabaseFetch('appointments', {
            method: 'POST',
            headers: { Prefer: 'return=representation' },
            body: toSupabaseAppointmentPayload(newAppointment)
          })
          createdAppointment = normalizeApiAppointment(pickFirst(payload))
        }
      }

      await refreshAppointments()
      addToast(appointment.isBlocked ? 'Horario bloqueado!' : 'Agendamento criado!', 'success')
      return createdAppointment
    } catch (error) {
      console.error('Error adding appointment:', error)
      addToast(error.message || 'Erro ao criar agendamento', 'error')
      return null
    }
  }

  const updateAppointment = async (appointment) => {
    try {
      const blockedPatient = appointment.isBlocked ? await ensureBlockedPatient() : null
      const updatedAppointment = {
        patientId: blockedPatient?.id || appointment.patient_id || appointment.patientId,
        date: appointment.date,
        time: appointment.time,
        type: appointment.isBlocked ? BLOCKED_APPOINTMENT_TYPE : appointment.type,
        status: toDatabaseAppointmentStatus(appointment.status || 'pending'),
        notes: appointment.isBlocked
          ? buildBlockedAppointmentNotes(appointment.notes)
          : appointment.notes || null
      }

      if (hasAppointmentConflict({
        appointment: { ...updatedAppointment, patient_id: updatedAppointment.patientId, status: appointment.status },
        appointments: state.appointments,
        ignoreAppointmentId: appointment.id
      })) {
        addToast('Ja existe um agendamento conflitante nesse intervalo', 'error')
        return null
      }

      let savedAppointment = null

      if (useLocalAdminMode) {
        const payload = await supabaseFetch(`appointments?id=eq.${encodeURIComponent(appointment.id)}`, {
          method: 'PATCH',
          headers: { Prefer: 'return=representation' },
          body: toSupabaseAppointmentPayload(updatedAppointment)
        })
        savedAppointment = normalizeApiAppointment(pickFirst(payload))
      } else {
        try {
          const payload = await apiFetch(`appointments/${appointment.id}`, {
            method: 'PUT',
            body: JSON.stringify({
              ...updatedAppointment,
              time: toDatabaseTime(updatedAppointment.time)
            })
          })
          savedAppointment = normalizeApiAppointment(payload?.data)
        } catch (error) {
          console.warn('Falling back to Supabase appointment update:', error)
          const payload = await supabaseFetch(`appointments?id=eq.${encodeURIComponent(appointment.id)}`, {
            method: 'PATCH',
            headers: { Prefer: 'return=representation' },
            body: toSupabaseAppointmentPayload(updatedAppointment)
          })
          savedAppointment = normalizeApiAppointment(pickFirst(payload))
        }
      }

      await refreshAppointments()
      return savedAppointment
    } catch (error) {
      console.error('Error updating appointment:', error)
      addToast(error.message || 'Erro ao atualizar agendamento', 'error')
      return null
    }
  }

  const deleteAppointment = async (id) => {
    try {
      if (useLocalAdminMode) {
        await supabaseFetch(`appointments?id=eq.${encodeURIComponent(id)}`, {
          method: 'PATCH',
          headers: { Prefer: 'return=representation' },
          body: { status: 'cancelled' }
        })
      } else {
        try {
          await apiFetch(`appointments/${id}`, {
            method: 'DELETE'
          })
        } catch (error) {
          console.warn('Falling back to Supabase appointment cancellation:', error)
          await supabaseFetch(`appointments?id=eq.${encodeURIComponent(id)}`, {
            method: 'PATCH',
            headers: { Prefer: 'return=representation' },
            body: { status: 'cancelled' }
          })
        }
      }

      await refreshAppointments()
      addToast('Agendamento cancelado', 'info')
    } catch (error) {
      console.error('Error cancelling appointment:', error)
      addToast(error.message || 'Erro ao cancelar agendamento', 'error')
    }
  }

  const deleteBlockedAppointment = async (appointment) => {
    try {
      const currentAppointment = appointment || null
      const currentPatient = currentAppointment?.patient_id
        ? (state.patients || []).find((patient) => patient.id === currentAppointment.patient_id)
        : null

      if (!isBlockedAppointment(currentAppointment, currentPatient)) {
        addToast('Esse registro nao e um bloqueio valido', 'error')
        return false
      }

      if (useLocalAdminMode) {
        await supabaseFetch(`appointments?id=eq.${encodeURIComponent(currentAppointment.id)}`, {
          method: 'DELETE'
        })
      } else {
        try {
          await apiFetch(`appointments/${currentAppointment.id}?permanent=true`, {
            method: 'DELETE'
          })
        } catch (error) {
          console.warn('Falling back to Supabase blocked appointment deletion:', error)
          await supabaseFetch(`appointments?id=eq.${encodeURIComponent(currentAppointment.id)}`, {
            method: 'DELETE'
          })
        }
      }

      await refreshAppointments()
      addToast('Bloqueio excluido em definitivo', 'success')
      return true
    } catch (error) {
      console.error('Error deleting blocked appointment:', error)
      addToast(error.message || 'Erro ao excluir bloqueio', 'error')
      return false
    }
  }

  const getPatient = (id) => {
    return (state.patients || []).find((patient) => patient.id === id)
  }

  const value = {
    patients: state.patients,
    appointments: state.appointments,
    consultationTypes: state.consultationTypes,
    currentView: state.currentView,
    toasts: state.toasts,
    theme: state.theme,
    adminUser,
    adminTokenDetails,
    canManageAdminToken: Boolean(adminToken) && !useLocalAdminMode,
    setView: (view) => dispatch({ type: 'SET_VIEW', payload: view }),
    setTheme: (theme) => dispatch({ type: 'SET_THEME', payload: theme }),
    addPatient,
    updatePatient,
    deletePatient,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    deleteBlockedAppointment,
    saveConsultationTypes,
    loadAdminTokenDetails,
    regenerateAdminToken,
    getPatient,
    addToast,
    logoutAdmin
  }

  const doctorElement = (
    <AppContext.Provider value={value}>
      {!authReady ? (
        <div className="app app--loading">
          <main className="main-content">
            <div className="glass-card" style={{ padding: 24 }}>Validando acesso ao dashboard medico...</div>
          </main>
        </div>
      ) : !adminToken ? (
        <AdminLogin onLogin={handleAdminLogin} loading={loginLoading} error={loginError} />
      ) : (
        <div className="app">
          <Header />
          <main className="main-content">
            {state.currentView === 'dashboard' && <Dashboard />}
            {state.currentView === 'blocked' && <BlockedAppointments />}
            {state.currentView === 'patients' && <PatientList />}
          </main>
          <Toast toasts={state.toasts} />
        </div>
      )}
    </AppContext.Provider>
  )

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/paciente/*" element={<PatientLogin />} />
        <Route path="/*" element={doctorElement} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
