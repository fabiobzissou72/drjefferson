import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Clock, ChevronLeft, ChevronRight, Check, LogOut, User, Moon, Sun, Building2, Video } from 'lucide-react'
import { getAppointmentStatus } from '../lib/appointmentStatus'
import { formatDateKey, hasAppointmentConflict, normalizeTime, toDatabaseTime } from '../lib/appointmentUtils'
import {
  fetchConsultationTypes,
  formatConsultationDuration,
  formatConsultationPrice,
  getActiveConsultationTypes,
  getConsultationModeLabel,
  getConsultationTypeDetails,
  loadStoredConsultationTypes
} from '../lib/consultationTypes'
import { APPOINTMENT_TIME_SLOTS } from '../lib/timeSlots'
import './PatientDashboard.css'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const DASHBOARD_REFRESH_INTERVAL_MS = 5000
const CONSULTATION_TYPES_STORAGE_KEY = 'drjefferson_consultation_types'

function PatientDashboard({ patient, onLogout, theme = 'light', onToggleTheme }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)
  const [selectedType, setSelectedType] = useState('')
  const [appointments, setAppointments] = useState([])
  const [myAppointments, setMyAppointments] = useState([])
  const [dayAppointments, setDayAppointments] = useState([])
  const [consultationTypes, setConsultationTypes] = useState(() => loadStoredConsultationTypes())
  const [showSuccess, setShowSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const activeConsultationTypes = getActiveConsultationTypes(consultationTypes)

  const syncConsultationTypes = async () => {
    const types = await fetchConsultationTypes()
    setConsultationTypes(types)
    return types
  }

  const fetchPortalData = async (endpoint) => {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
      cache: 'no-store',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache'
      }
    })

    if (!response.ok) {
      throw new Error(`Portal fetch error: ${response.status}`)
    }

    return response.json()
  }

  useEffect(() => {
    void syncConsultationTypes()
    fetchMyAppointments()
    fetchMonthAppointments()
  }, [patient.id])

  useEffect(() => {
    if (selectedDate) {
      fetchDayAppointments(selectedDate)
    }
  }, [selectedDate])

  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === CONSULTATION_TYPES_STORAGE_KEY) {
        void syncConsultationTypes()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  useEffect(() => {
    const refreshDashboardData = () => {
      void syncConsultationTypes()
      fetchMyAppointments()
      fetchMonthAppointmentsByDate(currentDate)

      if (selectedDate) {
        fetchDayAppointments(selectedDate)
      }
    }

    const intervalId = window.setInterval(refreshDashboardData, DASHBOARD_REFRESH_INTERVAL_MS)
    const handleWindowFocus = () => refreshDashboardData()
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshDashboardData()
      }
    }

    window.addEventListener('focus', handleWindowFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener('focus', handleWindowFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [currentDate, selectedDate])

  const fetchMonthAppointments = async () => {
    try {
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth() + 1
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`
      const endDate = `${year}-${String(month).padStart(2, '0')}-31`

      const data = await fetchPortalData(`appointments?date=gte.${startDate}&date=lte.${endDate}&status=neq.cancelled&select=date`)
      setAppointments(data || [])
    } catch (error) {
      console.error('Error fetching month appointments:', error)
    }
  }

  const fetchMyAppointments = async () => {
    try {
      const data = await fetchPortalData(`appointments?patient_id=eq.${patient.id}&order=date.desc&select=*`)
      setMyAppointments((data || []).map((appointment) => ({
        ...appointment,
        time: normalizeTime(appointment.time)
      })))
    } catch (error) {
      console.error('Error fetching appointments:', error)
    }
  }

  const fetchDayAppointments = async (date) => {
    try {
      const data = await fetchPortalData(`appointments?date=eq.${date}&status=neq.cancelled&select=date,time,type,patient_id,status`)
      setDayAppointments((data || []).map((appointment) => ({
        ...appointment,
        date: appointment.date || date,
        time: normalizeTime(appointment.time),
        type: appointment.type
      })))
    } catch (error) {
      console.error('Error fetching day appointments:', error)
    }
  }

  const fetchMonthAppointmentsByDate = async (date) => {
    try {
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`
      const endDate = `${year}-${String(month).padStart(2, '0')}-31`

      const data = await fetchPortalData(`appointments?date=gte.${startDate}&date=lte.${endDate}&status=neq.cancelled&select=date`)
      setAppointments(data || [])
    } catch (error) {
      console.error('Error fetching month appointments:', error)
    }
  }

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days = []

    for (let index = 0; index < firstDay; index += 1) {
      days.push({ day: null, date: null })
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, month, day)
      const dateStr = formatDateKey(date)
      const hasAppointment = (appointments || []).some((appointment) => appointment.date === dateStr)

      days.push({
        day,
        date: dateStr,
        isPast: date < new Date(new Date().setHours(0, 0, 0, 0)),
        isToday: date.toDateString() === new Date().toDateString(),
        hasAppointment
      })
    }

    return days
  }

  const handlePrevMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    setCurrentDate(newDate)
    fetchMonthAppointmentsByDate(newDate)
  }

  const handleNextMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    setCurrentDate(newDate)
    fetchMonthAppointmentsByDate(newDate)
  }

  const handleDateSelect = (dayInfo) => {
    if (dayInfo.day && !dayInfo.isPast) {
      setSelectedDate(dayInfo.date)
      setSelectedTime(null)
      setSelectedType('')
    }
  }

  const handleSubmitAppointment = async () => {
    if (!selectedDate || !selectedTime || !selectedType) {
      return
    }

    setLoading(true)

    try {
      const existingAppointments = (await fetchPortalData(
        `appointments?date=eq.${selectedDate}&status=neq.cancelled&select=id,date,time,type,patient_id,status`
      )).map((appointment) => ({
        ...appointment,
        date: appointment.date || selectedDate,
        time: normalizeTime(appointment.time),
        type: appointment.type
      }))

      if (hasAppointmentConflict({
        appointment: { date: selectedDate, time: selectedTime, type: selectedType },
        appointments: existingAppointments
      })) {
        alert('Este horario ja esta agendado. Escolha outro horario.')
        fetchDayAppointments(selectedDate)
        setLoading(false)
        return
      }

      const response = await fetch(`${SUPABASE_URL}/rest/v1/appointments`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal'
        },
        body: JSON.stringify({
          patient_id: patient.id,
          date: selectedDate,
          time: toDatabaseTime(selectedTime),
          type: selectedType,
          status: 'pending'
        })
      })

      if (response.ok) {
        setShowSuccess(true)
        setSelectedDate(null)
        setSelectedTime(null)
        setSelectedType('')
        fetchMyAppointments()
        fetchMonthAppointmentsByDate(currentDate)
        fetchDayAppointments(selectedDate)
        setTimeout(() => setShowSuccess(false), 3000)
      } else {
        alert('Erro ao criar agendamento. Tente novamente.')
      }
    } catch (error) {
      console.error('Error creating appointment:', error)
      alert('Erro ao criar agendamento. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr) => {
    const date = new Date(`${dateStr}T00:00:00`)
    return date.toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    })
  }

  const getStatusColor = (status) => {
    if (status === 'completed') {
      return 'var(--primary)'
    }

    return getAppointmentStatus(status).color
  }

  const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div className="patient-dashboard">
      <header className="patient-dashboard__header">
        <div className="patient-dashboard__header-content">
          <div className="patient-dashboard__user">
            <div className="patient-dashboard__avatar">
              <User size={24} />
            </div>
            <div>
              <h2>{patient.name}</h2>
              <p>Bem-vindo ao seu portal</p>
            </div>
          </div>

          <div className="patient-dashboard__actions">
            <button
              type="button"
              onClick={onToggleTheme}
              className="patient-dashboard__theme-toggle"
              title={theme === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro'}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            <button onClick={onLogout} className="patient-dashboard__logout">
              <LogOut size={18} />
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="patient-dashboard__main">
        <section className="patient-dashboard__schedule">
          <h3>Agendar Consulta</h3>

          <div className="patient-dashboard__calendar">
            <div className="calendar__header">
              <button onClick={handlePrevMonth}>
                <ChevronLeft size={20} />
              </button>
              <span>{monthName}</span>
              <button onClick={handleNextMonth}>
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="calendar__weekdays">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>

            <div className="calendar__days">
              {getDaysInMonth().map((dayInfo, index) => (
                <button
                  key={`${dayInfo.date || 'empty'}-${index}`}
                  className={`calendar__day ${!dayInfo.day ? 'empty' : ''} ${dayInfo.isPast ? 'past' : ''} ${dayInfo.isToday ? 'today' : ''} ${selectedDate === dayInfo.date ? 'selected' : ''} ${dayInfo.hasAppointment && !dayInfo.isPast ? 'has-appointment' : ''}`}
                  onClick={() => handleDateSelect(dayInfo)}
                  disabled={!dayInfo.day || dayInfo.isPast}
                >
                  {dayInfo.day}
                  {dayInfo.hasAppointment && !dayInfo.isPast && <span className="appointment-dot" />}
                </button>
              ))}
            </div>
          </div>

          {selectedDate && (
            <motion.div className="patient-dashboard__type-select" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h4>Tipo de consulta</h4>
              {activeConsultationTypes.length === 0 ? (
                <div className="patient-dashboard__empty-types">
                  O medico ainda nao configurou tipos de consulta para agendamento online.
                </div>
              ) : (
                <div className="type-options">
                  {activeConsultationTypes.map((type) => {
                    const details = getConsultationTypeDetails(type.value, consultationTypes)
                    const ModeIcon = details.mode === 'online' ? Video : Building2

                    return (
                      <button
                        key={type.value}
                        className={`type-option ${selectedType === type.value ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedType(type.value)
                          setSelectedTime(null)
                        }}
                      >
                        <span className="type-label">{details.label}</span>
                        <span className="type-price">{formatConsultationPrice(details.price)}</span>
                        <span className="type-mode">
                          <ModeIcon size={14} />
                          {getConsultationModeLabel(details.mode)} - {formatConsultationDuration(details.durationMinutes)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )}

          {selectedDate && selectedType && (
            <motion.div className="patient-dashboard__time-select" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h4>Horarios disponiveis para {formatDate(selectedDate)}</h4>
              <div className="time-slots">
                {APPOINTMENT_TIME_SLOTS.map((time) => {
                  const isBooked = hasAppointmentConflict({
                    appointment: { date: selectedDate, time, type: selectedType },
                    appointments: dayAppointments
                  })

                  return (
                    <button
                      key={time}
                      className={`time-slot ${selectedTime === time ? 'selected' : ''} ${isBooked ? 'booked' : ''}`}
                      onClick={() => !isBooked && setSelectedTime(time)}
                      disabled={isBooked}
                    >
                      {time}
                      {isBooked && <span className="booked-label">Ocupado</span>}
                    </button>
                  )
                })}
              </div>
            </motion.div>
          )}

          {selectedType && selectedTime && (
            <motion.button
              className="patient-dashboard__submit"
              onClick={handleSubmitAppointment}
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? 'Agendando...' : `Confirmar agendamento para ${formatDate(selectedDate)} as ${selectedTime}`}
            </motion.button>
          )}
        </section>

        <section className="patient-dashboard__appointments">
          <h3>Meus Agendamentos</h3>

          {myAppointments.length === 0 ? (
            <div className="no-appointments">
              <Calendar size={48} />
              <p>Nenhum agendamento encontrado</p>
            </div>
          ) : (
            <div className="appointments-list">
              {myAppointments.map((appointment) => {
                const details = getConsultationTypeDetails(appointment.type, consultationTypes)

                return (
                  <div key={appointment.id} className="appointment-card">
                    <div className="appointment-card__date">
                      <Calendar size={18} />
                      <span>{formatDate(appointment.date)}</span>
                    </div>
                    <div className="appointment-card__time">
                      <Clock size={18} />
                      <span>{appointment.time}</span>
                    </div>
                    <div className="appointment-card__type">
                      {details.label} • {getConsultationModeLabel(details.mode)}
                    </div>
                    <div className="appointment-card__type appointment-card__type--meta">
                      {formatConsultationDuration(details.durationMinutes)} - {formatConsultationPrice(details.price)}
                    </div>
                    <div className="appointment-card__status" style={{ color: getStatusColor(appointment.status) }}>
                      {appointment.status === 'pending'
                        ? 'Pendente'
                        : appointment.status === 'confirmed'
                          ? 'Confirmado'
                          : appointment.status === 'cancelled'
                            ? 'Cancelado'
                            : 'Concluido'}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </main>

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            className="patient-dashboard__success"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
          >
            <Check size={24} />
            <span>Agendamento realizado com sucesso!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default PatientDashboard
