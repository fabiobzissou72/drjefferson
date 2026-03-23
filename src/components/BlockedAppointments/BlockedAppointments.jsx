import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock, Lock, Plus, Trash2 } from 'lucide-react'
import { useApp } from '../../App'
import AppointmentModal from '../AppointmentModal/AppointmentModal'
import { getBlockedAppointmentTitle, isBlockedAppointment, stripBlockedAppointmentPrefix } from '../../lib/blockedAppointments'
import { normalizeTime } from '../../lib/appointmentUtils'
import './BlockedAppointments.css'

function BlockedAppointments() {
  const { appointments, getPatient, deleteBlockedAppointment } = useApp()
  const [showModal, setShowModal] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState(null)

  const blockedAppointments = useMemo(() => {
    return (appointments || [])
      .filter((appointment) => {
        const patient = getPatient(appointment.patient_id)
        return appointment.status !== 'cancelled' && isBlockedAppointment(appointment, patient)
      })
      .sort((left, right) => {
        const leftKey = `${left.date} ${normalizeTime(left.time)}`
        const rightKey = `${right.date} ${normalizeTime(right.time)}`
        return leftKey.localeCompare(rightKey)
      })
  }, [appointments, getPatient])

  const formatDate = (dateStr) => {
    return new Date(`${dateStr}T00:00:00`).toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  const handleCreate = () => {
    setEditingAppointment(null)
    setShowModal(true)
  }

  const handleEdit = (appointment) => {
    setEditingAppointment(appointment)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingAppointment(null)
  }

  return (
    <div className="blocked-appointments">
      <motion.div
        className="blocked-appointments__header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div>
          <h1>Bloqueios da Agenda</h1>
          <p>Crie, ajuste e exclua horarios em que o medico nao podera atender.</p>
        </div>

        <div className="blocked-appointments__header-actions">
          <div className="blocked-appointments__badge">
            <Lock size={16} />
            <span>{blockedAppointments.length} bloqueios ativos</span>
          </div>
          <button type="button" className="blocked-appointments__add-btn" onClick={handleCreate}>
            <Plus size={18} />
            Novo Bloqueio
          </button>
        </div>
      </motion.div>

      <motion.div
        className="blocked-appointments__content glass-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {blockedAppointments.length === 0 ? (
          <div className="blocked-appointments__empty">
            <Lock size={56} strokeWidth={1.5} />
            <h3>Nenhum bloqueio ativo</h3>
            <p>Use o botao Novo Bloqueio para reservar horarios indisponiveis.</p>
          </div>
        ) : (
          <div className="blocked-appointments__list">
            {blockedAppointments.map((appointment, index) => {
              const reason = stripBlockedAppointmentPrefix(appointment.notes)

              return (
                <motion.div
                  key={appointment.id}
                  className="blocked-appointments__card"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                  onClick={() => handleEdit(appointment)}
                >
                  <div className="blocked-appointments__card-main">
                    <div className="blocked-appointments__icon">
                      <Lock size={20} />
                    </div>

                    <div className="blocked-appointments__info">
                      <h3>{getBlockedAppointmentTitle(appointment)}</h3>
                      <div className="blocked-appointments__meta">
                        <span>
                          <Calendar size={14} />
                          {formatDate(appointment.date)}
                        </span>
                        <span>
                          <Clock size={14} />
                          {normalizeTime(appointment.time)}
                        </span>
                      </div>
                      <p>{reason || 'Horario reservado pelo medico para indisponibilidade.'}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="blocked-appointments__delete"
                    onClick={(event) => {
                      event.stopPropagation()
                      deleteBlockedAppointment(appointment)
                    }}
                  >
                    <Trash2 size={16} />
                    Excluir bloqueio
                  </button>
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>

      {showModal && (
        <AppointmentModal
          appointment={editingAppointment}
          date={editingAppointment?.date}
          forcedMode="blocked"
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}

export default BlockedAppointments
