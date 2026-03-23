import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { X, Search, User, Calendar, Clock, FileText, Lock, Building2, Video } from 'lucide-react'
import { useApp } from '../../App'
import { hasAppointmentConflict, normalizeTime } from '../../lib/appointmentUtils'
import { APPOINTMENT_TIME_SLOTS } from '../../lib/timeSlots'
import {
  BLOCKED_APPOINTMENT_TYPE,
  BLOCKED_PATIENT_NAME,
  isBlockedPatient,
  isBlockedAppointment,
  stripBlockedAppointmentPrefix
} from '../../lib/blockedAppointments'
import {
  formatConsultationPrice,
  formatConsultationDuration,
  getActiveConsultationTypes,
  getConsultationModeLabel,
  getConsultationTypeDetails
} from '../../lib/consultationTypes'
import { matchesPatientSearch } from '../../lib/patientSearch'
import '../Modal/Modal.css'
import './AppointmentModal.css'

function AppointmentModal({ date, appointment, onClose, forcedMode = null }) {
  const { patients, appointments, addAppointment, updateAppointment, consultationTypes } = useApp()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [isBlockedMode, setIsBlockedMode] = useState(false)
  const [formData, setFormData] = useState({
    date: date || new Date().toISOString().split('T')[0],
    time: normalizeTime(appointment?.time) || '09:00',
    type: appointment?.type || '',
    notes: appointment?.notes || ''
  })
  const dropdownRef = useRef(null)

  const activeConsultationTypes = useMemo(
    () => getActiveConsultationTypes(consultationTypes),
    [consultationTypes]
  )

  useEffect(() => {
    const currentPatient = appointment?.patient || null
    const blockedMode = forcedMode === 'blocked' || isBlockedAppointment(appointment, currentPatient)
    const defaultType = appointment?.type || activeConsultationTypes[0]?.value || 'first'

    setIsBlockedMode(blockedMode)
    setSelectedPatient(blockedMode ? null : currentPatient || null)
    setSearchTerm('')
    setShowDropdown(false)
    setFormData({
      date: date || appointment?.date || new Date().toISOString().split('T')[0],
      time: normalizeTime(appointment?.time) || '09:00',
      type: blockedMode ? BLOCKED_APPOINTMENT_TYPE : defaultType,
      notes: blockedMode ? stripBlockedAppointmentPrefix(appointment?.notes) : appointment?.notes || ''
    })
  }, [
    activeConsultationTypes,
    appointment?.date,
    appointment?.id,
    appointment?.notes,
    appointment?.patient,
    appointment?.time,
    appointment?.type,
    date,
    forcedMode
  ])

  useEffect(() => {
    if (isBlockedMode || selectedPatient || !appointment?.patient_id) {
      return
    }

    const currentPatient = (patients || []).find((patient) => patient.id === appointment.patient_id)

    if (currentPatient) {
      setSelectedPatient(currentPatient)
    }
  }, [appointment?.patient_id, isBlockedMode, patients, selectedPatient])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredPatients = (patients || []).filter((patient) =>
    !isBlockedPatient(patient) && matchesPatientSearch(patient, searchTerm)
  )

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient)
    setSearchTerm('')
    setShowDropdown(false)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!isBlockedMode && !selectedPatient) {
      return
    }

    const appointmentData = {
      ...formData,
      patientId: selectedPatient?.id,
      type: isBlockedMode ? BLOCKED_APPOINTMENT_TYPE : formData.type,
      isBlocked: isBlockedMode,
      status: appointment?.status || 'pending'
    }

    const savedAppointment = appointment?.id
      ? await updateAppointment({ ...appointment, ...appointmentData })
      : await addAppointment(appointmentData)

    if (savedAppointment) {
      onClose()
    }
  }

  const isSlotBooked = (time) => hasAppointmentConflict({
    appointment: {
      date: formData.date,
      time,
      type: isBlockedMode ? BLOCKED_APPOINTMENT_TYPE : formData.type
    },
    appointments,
    ignoreAppointmentId: appointment?.id
  })

  const modalTitle = appointment?.id
    ? (isBlockedMode ? 'Editar Bloqueio' : 'Editar Agendamento')
    : (isBlockedMode ? 'Novo Bloqueio' : 'Novo Agendamento')

  const submitLabel = appointment?.id
    ? (isBlockedMode ? 'Salvar Bloqueio' : 'Salvar Alteracoes')
    : (isBlockedMode ? 'Criar Bloqueio' : 'Criar Agendamento')

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="modal appointment-modal glass-card"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.2 }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal__header">
          <h2>{modalTitle}</h2>
          <button className="modal__close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form className="modal__form" onSubmit={handleSubmit}>
          <div className="form__group patient-select" ref={dropdownRef}>
            <label>
              {isBlockedMode ? <Lock size={16} /> : <User size={16} />}
              {isBlockedMode ? 'Bloqueio da agenda' : 'Paciente *'}
            </label>

            {isBlockedMode ? (
              <div className="selected-patient selected-patient--blocked">
                <div className="selected-patient__avatar selected-patient__avatar--blocked">
                  <Lock size={18} />
                </div>
                <div className="selected-patient__info">
                  <span className="selected-patient__name">{BLOCKED_PATIENT_NAME}</span>
                  <span className="selected-patient__cpf">
                    Reserve este horario para compromissos externos ou indisponibilidade
                  </span>
                </div>
              </div>
            ) : selectedPatient ? (
              <div className="selected-patient">
                <div className="selected-patient__avatar">
                  {selectedPatient.name.split(' ').map((name) => name[0]).slice(0, 2).join('')}
                </div>
                <div className="selected-patient__info">
                  <span className="selected-patient__name">{selectedPatient.name}</span>
                  <span className="selected-patient__cpf">{selectedPatient.cpf}</span>
                </div>
                <button
                  type="button"
                  className="selected-patient__change"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  Trocar
                </button>
              </div>
            ) : (
              <div className="patient-search">
                <Search size={16} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => {
                    setSearchTerm(event.target.value)
                    setShowDropdown(true)
                  }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Buscar paciente por nome, CPF ou telefone..."
                />
              </div>
            )}

            {showDropdown && !isBlockedMode && (
              <motion.div
                className="patient-dropdown"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {filteredPatients.length === 0 ? (
                  <div className="patient-dropdown__empty">Nenhum paciente encontrado</div>
                ) : (
                  filteredPatients.map((patient) => (
                    <div
                      key={patient.id}
                      className="patient-dropdown__item"
                      onClick={() => handleSelectPatient(patient)}
                    >
                      <div className="patient-dropdown__avatar">
                        {patient.name.split(' ').map((name) => name[0]).slice(0, 2).join('')}
                      </div>
                      <div className="patient-dropdown__info">
                        <span className="patient-dropdown__name">{patient.name}</span>
                        <span className="patient-dropdown__details">{patient.cpf} - {patient.phone}</span>
                      </div>
                    </div>
                  ))
                )}
              </motion.div>
            )}
          </div>

          <div className="form__row">
            <div className="form__group">
              <label>
                <Calendar size={16} />
                Data *
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={(event) => setFormData({ ...formData, date: event.target.value })}
              />
            </div>

            <div className="form__group">
              <label>
                <Clock size={16} />
                Horario *
              </label>
              <select
                name="time"
                value={formData.time}
                onChange={(event) => setFormData({ ...formData, time: event.target.value })}
              >
                {APPOINTMENT_TIME_SLOTS.map((time) => (
                  <option key={time} value={time} disabled={isSlotBooked(time)}>
                    {time}{isSlotBooked(time) ? ' - ocupado' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {!isBlockedMode && (
            <div className="form__group">
              <label>
                <FileText size={16} />
                Tipo de Consulta *
              </label>

              {activeConsultationTypes.length === 0 ? (
                <div className="appointment-modal__empty-types">
                  Nenhum tipo de consulta ativo. Configure os tipos no painel do medico.
                </div>
              ) : (
                <div className="type-options">
                  {activeConsultationTypes.map((type) => {
                    const details = getConsultationTypeDetails(type.value, consultationTypes)
                    const ModeIcon = details.mode === 'online' ? Video : Building2

                    return (
                      <button
                        key={details.value}
                        type="button"
                        className={`type-option ${formData.type === details.value ? 'active' : ''}`}
                        onClick={() => setFormData({ ...formData, type: details.value })}
                      >
                        <span className="type-option__icon">
                          <ModeIcon size={20} />
                        </span>
                        <span className="type-option__label">{details.label}</span>
                        <span className="type-option__meta">
                          {`${getConsultationModeLabel(details.mode)} - ${formatConsultationDuration(details.durationMinutes)} - ${formatConsultationPrice(details.price)}`}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          <div className="form__group">
            <label>
              <FileText size={16} />
              {isBlockedMode ? 'Motivo do bloqueio' : 'Observacoes'}
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={(event) => setFormData({ ...formData, notes: event.target.value })}
              placeholder={
                isBlockedMode
                  ? 'Ex.: consulta externa, congresso, reuniao, deslocamento...'
                  : 'Observacoes sobre o agendamento...'
              }
              rows={3}
            />
          </div>

          <div className="modal__actions">
            <button type="button" className="btn btn--secondary" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={(!isBlockedMode && !selectedPatient) || (!isBlockedMode && activeConsultationTypes.length === 0)}
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default AppointmentModal
