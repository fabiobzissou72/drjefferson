import { useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Calendar as CalendarIcon,
  Users,
  Clock,
  CheckCircle,
  Plus,
  Settings2,
  FileDown
} from 'lucide-react'
import { generateDailyReport } from '../../lib/reportPDF'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import ptBrLocale from '@fullcalendar/core/locales/pt-br'
import { useApp } from '../../App'
import { addMinutes, buildAppointmentDateTime, getAppointmentDurationMinutes, normalizeTime } from '../../lib/appointmentUtils'
import { getAppointmentCalendarColors, getAppointmentStatus } from '../../lib/appointmentStatus'
import { formatConsultationDuration, getConsultationTypeDetails, getConsultationModeLabel } from '../../lib/consultationTypes'
import { getBlockedAppointmentTitle, isBlockedAppointment, isBlockedPatient } from '../../lib/blockedAppointments'
import AppointmentModal from '../AppointmentModal/AppointmentModal'
import AppointmentDetailModal from '../AppointmentDetailModal/AppointmentDetailModal'
import ConsultationSettingsModal from '../ConsultationSettingsModal/ConsultationSettingsModal'
import './Dashboard.css'

function Dashboard() {
  const { appointments, patients, getPatient, addToast, theme, consultationTypes } = useApp()
  const calendarRef = useRef(null)
  const [showModal, setShowModal] = useState(false)
  const [showConsultationSettings, setShowConsultationSettings] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [calendarResetKey, setCalendarResetKey] = useState(0)
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0])
  const formatDateBR = (value) => new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR')

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    const todayAppointments = (appointments || []).filter((appointment) => appointment.date === today && appointment.status !== 'cancelled')

    return {
      total: appointments?.filter((appointment) => appointment.status !== 'cancelled').length || 0,
      today: todayAppointments.length,
      confirmed: todayAppointments.filter((appointment) => appointment.status === 'confirmed').length,
      missed: (appointments || []).filter((appointment) => appointment.status === 'missed').length,
      patients: (patients || []).filter((patient) => !isBlockedPatient(patient)).length
    }
  }, [appointments, patients])

  const calendarEvents = useMemo(() => {
    return (appointments || []).map((appointment) => {
      const patient = getPatient(appointment.patient_id)
      const blockedAppointment = isBlockedAppointment(appointment, patient)
      const status = getAppointmentStatus(appointment.status)
      const consultationType = getConsultationTypeDetails(appointment.type, consultationTypes)
      const calendarColors = blockedAppointment
        ? {
            backgroundColor: theme === 'light' ? '#e2e8f0' : '#475569',
            borderColor: theme === 'light' ? '#94a3b8' : '#64748b',
            textColor: theme === 'light' ? '#0f172a' : '#ffffff'
          }
        : getAppointmentCalendarColors(appointment.status, theme)

      return {
        id: appointment.id,
        title: blockedAppointment ? getBlockedAppointmentTitle(appointment) : patient?.name || 'Paciente',
        start: buildAppointmentDateTime(appointment.date, appointment.time),
        end: addMinutes(buildAppointmentDateTime(appointment.date, appointment.time), getAppointmentDurationMinutes(appointment)),
        backgroundColor: calendarColors.backgroundColor,
        borderColor: calendarColors.borderColor,
        textColor: calendarColors.textColor,
        extendedProps: {
          ...appointment,
          patient,
          statusConfig: status,
          consultationType
        }
      }
    })
  }, [appointments, consultationTypes, getPatient, theme])

  const todayAppointments = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    return (appointments || [])
      .filter((appointment) => appointment.date === today && appointment.status !== 'cancelled')
      .sort((left, right) => left.time.localeCompare(right.time))
  }, [appointments])

  const spotlightAppointment = useMemo(() => {
    const now = Date.now()

    const upcomingAppointments = (appointments || [])
      .filter((appointment) => appointment.status !== 'cancelled')
      .map((appointment) => ({
        appointment,
        timestamp: new Date(`${appointment.date}T${normalizeTime(appointment.time)}:00`).getTime()
      }))
      .filter((entry) => Number.isFinite(entry.timestamp) && entry.timestamp >= now)
      .sort((left, right) => left.timestamp - right.timestamp)

    return upcomingAppointments[0]?.appointment || todayAppointments[0] || null
  }, [appointments, todayAppointments])

  const getInitialView = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 'timeGridDay'
    }

    return 'dayGridMonth'
  }

  const closeAppointmentModal = () => {
    setShowModal(false)
    setSelectedDate(null)
    calendarRef.current?.getApi().unselect()
    setCalendarResetKey((currentKey) => currentKey + 1)
  }

  const handleDateClick = (arg) => {
    setSelectedAppointment(null)
    setShowDetailModal(false)
    setSelectedDate(arg.dateStr)
    setShowModal(true)
  }

  const handleCalendarContainerClick = (event) => {
    const target = event.target

    if (!(target instanceof HTMLElement)) {
      return
    }

    if (
      target.closest('.fc-event') ||
      target.closest('.fc-button') ||
      target.closest('.fc-more-link') ||
      target.closest('.fc-popover')
    ) {
      return
    }

    const dateCell = target.closest('[data-date]')
    const dateValue = dateCell?.getAttribute('data-date') || ''

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return
    }

    if (showModal && selectedDate === dateValue) {
      return
    }

    setSelectedAppointment(null)
    setShowDetailModal(false)
    setSelectedDate(dateValue)
    setShowModal(true)
  }

  const handleEventClick = (arg) => {
    setSelectedAppointment(arg.event.extendedProps)
    setShowDetailModal(true)
  }

  const handleEventDrop = ({ event }) => {
    const updatedAppointment = {
      ...event.extendedProps,
      date: event.start.toISOString().split('T')[0],
      time: event.start.toTimeString().slice(0, 5)
    }

    void updatedAppointment
    addToast('Horario reagendado com sucesso!', 'success')
  }

  const spotlightPatient = spotlightAppointment ? getPatient(spotlightAppointment.patient_id) : null
  const spotlightBlocked = spotlightAppointment
    ? isBlockedAppointment(spotlightAppointment, spotlightPatient)
    : false
  const spotlightType = spotlightAppointment
    ? getConsultationTypeDetails(spotlightAppointment.type, consultationTypes)
    : null

  const statCards = [
    { label: 'Agenda Viva', value: stats.total, icon: CalendarIcon, color: '#c7a46a' },
    { label: 'Entradas de Hoje', value: stats.today, icon: Clock, color: '#5f7493' },
    { label: 'Confirmados Hoje', value: stats.confirmed, icon: CheckCircle, color: '#5ea58b' },
    { label: 'Base de Pacientes', value: stats.patients, icon: Users, color: '#8f6f4a' }
  ]

  return (
    <div className="dashboard">
      <motion.div
        className="dashboard__header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="dashboard__hero">
          <div className="dashboard__title-section">
            <h1 className="dashboard__title">Agenda</h1>
          </div>

          <div className="dashboard__spotlight glass-card">
            <span className="dashboard__spotlight-label">Proximo foco</span>
            {spotlightAppointment ? (
              <>
                <strong className="dashboard__spotlight-title">
                  {spotlightBlocked
                    ? getBlockedAppointmentTitle(spotlightAppointment)
                    : spotlightPatient?.name || 'Paciente'}
                </strong>
                <span className="dashboard__spotlight-meta">
                  {formatDateBR(spotlightAppointment.date)} - {normalizeTime(spotlightAppointment.time)}
                  {!spotlightBlocked && spotlightType
                    ? ` - ${spotlightType.label} - ${formatConsultationDuration(spotlightType.durationMinutes)}`
                    : ''}
                </span>
              </>
            ) : (
              <>
                <strong className="dashboard__spotlight-title">Agenda sem pendencias imediatas</strong>
                <span className="dashboard__spotlight-meta">Nenhum compromisso futuro encontrado.</span>
              </>
            )}
          </div>
        </div>

        <div className="dashboard__header-actions">
          <div className="dashboard__report-group">
            <input
              type="date"
              value={reportDate}
              onChange={e => setReportDate(e.target.value)}
              className="dashboard__report-date"
            />
            <motion.button
              className="dashboard__secondary-btn"
              onClick={() => {
                const dayAppointments = (appointments || []).filter(
                  a => a.date === reportDate && a.status !== 'cancelled'
                ).sort((a, b) => a.time.localeCompare(b.time))
                generateDailyReport(reportDate, dayAppointments, getPatient)
              }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <FileDown size={18} />
              <span>Baixar Relatorio</span>
            </motion.button>
          </div>

          <motion.button
            className="dashboard__secondary-btn"
            onClick={() => setShowConsultationSettings(true)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Settings2 size={18} />
            <span>Tipos de Consulta</span>
          </motion.button>

          <motion.button
            className="dashboard__add-btn"
            onClick={() => {
              setSelectedDate(new Date().toISOString().split('T')[0])
              setShowModal(true)
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus size={20} />
            <span>Novo Agendamento</span>
          </motion.button>
        </div>
      </motion.div>

      <motion.div
        className="dashboard__stats"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            className="stat-card glass-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
          >
            <div className="stat-card__icon" style={{ background: `${stat.color}20`, color: stat.color }}>
              <stat.icon size={24} />
            </div>
            <div className="stat-card__content">
              <span className="stat-card__value">{stat.value}</span>
              <span className="stat-card__label">{stat.label}</span>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="dashboard__content">
        <motion.div
          className="dashboard__calendar glass-card"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="dashboard__section-head">
            <div>
              <span className="dashboard__section-kicker">Agenda principal</span>
              <h2 className="dashboard__section-title">Calendario clinico</h2>
            </div>
            <span className="dashboard__section-meta">Mes, semana e dia com o mesmo acabamento visual.</span>
          </div>

          <div onClickCapture={handleCalendarContainerClick}>
            <FullCalendar
              key={calendarResetKey}
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView={getInitialView()}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
              }}
              locales={[ptBrLocale]}
              locale="pt-br"
              buttonText={{
                today: 'Hoje',
                month: 'Mes',
                week: 'Semana',
                day: 'Dia'
              }}
              height="auto"
              contentHeight="auto"
              events={calendarEvents}
              dateClick={handleDateClick}
              eventClick={handleEventClick}
              eventDrop={handleEventDrop}
              editable={true}
              droppable={true}
              dayMaxEvents={3}
              moreLinkClick="popover"
              allDaySlot={false}
              slotDuration="00:30:00"
              snapDuration="00:30:00"
              slotEventOverlap={false}
              eventMinHeight={44}
              eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                meridiem: 'short'
              }}
              nowIndicator={true}
              eventDisplay="block"
              views={{
                dayGridMonth: {
                  eventTimeFormat: { hour: '2-digit', minute: '2-digit' }
                }
              }}
            />
          </div>
        </motion.div>

        <motion.div
          className="dashboard__today"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="today__shell glass-card">
            <div className="today__header">
              <div>
                <span className="dashboard__section-kicker">Ritmo do dia</span>
                <h2>Agenda de Hoje</h2>
              </div>
              <span className="today__date mono">
                {new Date().toLocaleDateString('pt-BR')}
              </span>
            </div>

            <div className="today__list">
            {todayAppointments.length === 0 ? (
              <motion.div className="today__empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <CalendarIcon size={48} strokeWidth={1} />
                <p>Nenhum agendamento para hoje</p>
                <span>Clique em "+" para criar um novo</span>
              </motion.div>
            ) : (
              todayAppointments.map((appointment, index) => {
                const patient = getPatient(appointment.patient_id)
                const blockedAppointment = isBlockedAppointment(appointment, patient)
                const status = getAppointmentStatus(appointment.status)
                const consultationType = getConsultationTypeDetails(appointment.type, consultationTypes)

                return (
                  <motion.div
                    key={appointment.id}
                    className="today__card"
                    style={{ borderLeftColor: blockedAppointment ? '#64748b' : status.color }}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => {
                      setSelectedAppointment(appointment)
                      setShowDetailModal(true)
                    }}
                  >
                    <div className="today__card-time mono">{normalizeTime(appointment.time)}</div>
                    <div className="today__card-content">
                      <h4>{blockedAppointment ? getBlockedAppointmentTitle(appointment) : patient?.name || 'Paciente'}</h4>
                      <span className="today__card-type">
                        {blockedAppointment
                          ? 'Horario indisponivel'
                          : `${consultationType.label} • ${getConsultationModeLabel(consultationType.mode)}`}
                      </span>
                    </div>
                    <div
                      className="today__card-status"
                      style={{
                        background: blockedAppointment ? 'rgba(100, 116, 139, 0.16)' : status.bg,
                        color: blockedAppointment ? '#475569' : status.color
                      }}
                    >
                      {blockedAppointment ? 'Bloqueado' : status.label}
                    </div>
                  </motion.div>
                )
              })
            )}
            </div>
          </div>
        </motion.div>
      </div>

      {showModal && <AppointmentModal key={selectedDate || 'new-appointment'} date={selectedDate} onClose={closeAppointmentModal} />}

      {showDetailModal && selectedAppointment && (
        <AppointmentDetailModal
          appointment={selectedAppointment}
          onClose={() => {
            setShowDetailModal(false)
            setSelectedAppointment(null)
          }}
        />
      )}

      {showConsultationSettings && (
        <ConsultationSettingsModal onClose={() => setShowConsultationSettings(false)} />
      )}
    </div>
  )
}

export default Dashboard
