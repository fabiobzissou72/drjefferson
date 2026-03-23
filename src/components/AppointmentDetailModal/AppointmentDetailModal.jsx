import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Calendar, Clock, FileText, Check, XCircle, RefreshCw, Edit, Trash2, AlertCircle, Lock } from 'lucide-react'
import { useApp } from '../../App'
import { getAppointmentStatus } from '../../lib/appointmentStatus'
import { formatConsultationDuration, formatConsultationPrice, getConsultationModeLabel, getConsultationTypeDetails } from '../../lib/consultationTypes'
import {
  getBlockedAppointmentTitle,
  isBlockedAppointment,
  stripBlockedAppointmentPrefix
} from '../../lib/blockedAppointments'
import AppointmentModal from '../AppointmentModal/AppointmentModal'
import './AppointmentDetailModal.css'

function AppointmentDetailModal({ appointment, onClose }) {
  const { updateAppointment, deleteAppointment, getPatient, addToast, setView, consultationTypes } = useApp()
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const patient = getPatient(appointment.patient_id)
  const blockedAppointment = isBlockedAppointment(appointment, patient)
  const status = getAppointmentStatus(appointment.status)
  const consultationType = getConsultationTypeDetails(appointment.type, consultationTypes)
  const StatusIcon = status.icon

  const handleStatusChange = async (newStatus) => {
    const result = await updateAppointment({ ...appointment, status: newStatus })

    if (!result) {
      return
    }

    const statusNames = {
      confirmed: 'confirmado',
      completed: 'compareceu',
      missed: 'faltou'
    }

    addToast(`Agendamento marcado como ${statusNames[newStatus]}!`, newStatus === 'completed' ? 'success' : 'info')
  }

  const handleDelete = () => {
    deleteAppointment(appointment.id)
    onClose()
  }

  const formatDate = (dateStr) => {
    const date = new Date(`${dateStr}T00:00:00`)
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="modal appointment-detail-modal glass-card"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.2 }}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="modal__header">
            <h2>Detalhes do Agendamento</h2>
            <button className="modal__close" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          <div className="appointment-detail">
            <div
              className="appointment-detail__status"
              style={{
                background: blockedAppointment ? 'rgba(100, 116, 139, 0.16)' : status.bg,
                borderColor: blockedAppointment ? '#64748b' : status.color
              }}
            >
              <StatusIcon size={20} style={{ color: blockedAppointment ? '#64748b' : status.color }} />
              <span style={{ color: blockedAppointment ? '#64748b' : status.color }}>
                {blockedAppointment ? 'Horario bloqueado' : status.label}
              </span>
            </div>

            <div className="appointment-detail__patient">
              <div className="appointment-detail__avatar">
                {blockedAppointment ? 'BL' : patient?.name?.split(' ').map((name) => name[0]).slice(0, 2).join('') || '??'}
              </div>
              <div className="appointment-detail__patient-info">
                <h3>{blockedAppointment ? getBlockedAppointmentTitle(appointment) : patient?.name || 'Paciente nao encontrado'}</h3>
                <span>{blockedAppointment ? 'Horario reservado pelo medico' : patient?.phone || '-'}</span>
                <span>{blockedAppointment ? 'Nao disponivel para novos agendamentos' : patient?.email || '-'}</span>
              </div>
            </div>

            <div className="appointment-detail__info">
              <div className="info-item">
                <Calendar size={18} />
                <div>
                  <label>Data</label>
                  <span>{formatDate(appointment.date)}</span>
                </div>
              </div>

              <div className="info-item">
                <Clock size={18} />
                <div>
                  <label>Horario</label>
                  <span className="mono">{appointment.time}</span>
                </div>
              </div>

              <div className="info-item">
                <FileText size={18} />
                <div>
                  <label>Tipo</label>
                  <span>
                    {blockedAppointment
                      ? 'Bloqueio manual'
                      : `${consultationType.label} • ${getConsultationModeLabel(consultationType.mode)}`}
                  </span>
                </div>
              </div>
            </div>

            {!blockedAppointment && (
              <div className="appointment-detail__notes">
                <h4>Consulta</h4>
                <p>{formatConsultationPrice(consultationType.price)} - {formatConsultationDuration(consultationType.durationMinutes)}</p>
              </div>
            )}

            {appointment.notes && (
              <div className="appointment-detail__notes">
                <h4>{blockedAppointment ? 'Motivo' : 'Observacoes'}</h4>
                <p>{blockedAppointment ? stripBlockedAppointmentPrefix(appointment.notes) || 'Sem motivo informado' : appointment.notes}</p>
              </div>
            )}

            <div className="appointment-detail__actions">
              {blockedAppointment && (
                <motion.button
                  className="action-btn action-btn--edit"
                  onClick={() => {
                    setView('blocked')
                    onClose()
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Lock size={18} />
                  Abrir Bloqueios
                </motion.button>
              )}

              {!blockedAppointment && appointment.status === 'pending' && (
                <>
                  <motion.button
                    className="action-btn action-btn--confirm"
                    onClick={() => handleStatusChange('confirmed')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Check size={18} />
                    Confirmou
                  </motion.button>
                  <motion.button
                    className="action-btn action-btn--missed"
                    onClick={() => handleStatusChange('missed')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <XCircle size={18} />
                    Faltou
                  </motion.button>
                </>
              )}

              {!blockedAppointment && appointment.status === 'confirmed' && (
                <>
                  <motion.button
                    className="action-btn action-btn--attended"
                    onClick={() => handleStatusChange('completed')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Check size={18} />
                    Compareceu
                  </motion.button>
                  <motion.button
                    className="action-btn action-btn--missed"
                    onClick={() => handleStatusChange('missed')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <XCircle size={18} />
                    Faltou
                  </motion.button>
                </>
              )}

              {!blockedAppointment && appointment.status !== 'cancelled' && appointment.status !== 'completed' && appointment.status !== 'missed' && (
                <motion.button
                  className="action-btn action-btn--reschedule"
                  onClick={() => setShowEditModal(true)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <RefreshCw size={18} />
                  Reagendar
                </motion.button>
              )}

              {!blockedAppointment && (
                <motion.button
                  className="action-btn action-btn--edit"
                  onClick={() => setShowEditModal(true)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Edit size={18} />
                  Editar
                </motion.button>
              )}

              {!blockedAppointment && appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                <motion.button
                  className="action-btn action-btn--cancel"
                  onClick={() => setShowDeleteConfirm(true)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Trash2 size={18} />
                  Cancelar
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {showDeleteConfirm && (
        <motion.div className="confirm-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="confirm-dialog glass-card" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
            <AlertCircle size={48} className="confirm-dialog__icon" />
            <h3>Cancelar Agendamento?</h3>
            <p>Esta acao nao pode ser desfeita.</p>
            <div className="confirm-dialog__actions">
              <button onClick={() => setShowDeleteConfirm(false)} className="btn btn--secondary">
                Voltar
              </button>
              <button onClick={handleDelete} className="btn btn--danger">
                Sim, Cancelar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {showEditModal && (
        <AppointmentModal appointment={appointment} date={appointment.date} onClose={() => setShowEditModal(false)} />
      )}
    </>
  )
}

export default AppointmentDetailModal
