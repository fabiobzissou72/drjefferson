import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus, Edit2, Trash2, Phone, Mail, Calendar, ChevronLeft, ChevronRight, UserX } from 'lucide-react'
import { useApp } from '../../App'
import { isBlockedPatient } from '../../lib/blockedAppointments'
import { matchesPatientSearch } from '../../lib/patientSearch'
import PatientModal from '../PatientModal/PatientModal'
import './PatientList.css'

function PatientList() {
  const { patients, deletePatient, addToast } = useApp()
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingPatient, setEditingPatient] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const itemsPerPage = 10

  const visiblePatients = useMemo(() => {
    return (patients || []).filter((patient) => !isBlockedPatient(patient))
  }, [patients])

  const filteredPatients = useMemo(() => {
    return visiblePatients.filter((patient) => matchesPatientSearch(patient, searchTerm))
  }, [visiblePatients, searchTerm])

  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage)
  const paginatedPatients = filteredPatients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleEdit = (patient) => {
    setEditingPatient(patient)
    setShowModal(true)
  }

  const handleDelete = (id) => {
    deletePatient(id)
    setDeleteConfirm(null)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingPatient(null)
  }

  const calculateAge = (birthDate) => {
    if (!birthDate) return '-'
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  return (
    <div className="patient-list">
      <motion.div 
        className="patient-list__header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="patient-list__title-section">
          <h1>Pacientes</h1>
          <p>{visiblePatients.length} pacientes cadastrados</p>
        </div>
        <motion.button 
          className="patient-list__add-btn"
          onClick={() => setShowModal(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus size={20} />
          <span>Novo Paciente</span>
        </motion.button>
      </motion.div>

      <motion.div 
        className="patient-list__search glass-card"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Search size={20} />
        <input
          type="text"
          placeholder="Buscar por nome, CPF ou telefone..."
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
        />
      </motion.div>

      <motion.div 
        className="patient-list__content glass-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        {paginatedPatients.length === 0 ? (
          <div className="patient-list__empty">
            <UserX size={64} strokeWidth={1} />
            <h3>{searchTerm ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado'}</h3>
            <p>{searchTerm ? 'Tente buscar com outros termos' : 'Clique em "Novo Paciente" para começar'}</p>
          </div>
        ) : (
          <>
            <div className="patient-table">
              <div className="patient-table__header">
                <div className="col-patient">Paciente</div>
                <div className="col-contact">Contato</div>
                <div className="col-cpf">CPF</div>
                <div className="col-age">Idade</div>
                <div className="col-actions">Ações</div>
              </div>
              <div className="patient-table__body">
                <AnimatePresence mode="popLayout">
                  {paginatedPatients.map((patient, index) => (
                    <motion.div 
                      key={patient.id}
                      className="patient-table__row"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="col-patient">
                        <div className="patient-avatar">
                          {patient.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                        </div>
                        <div className="patient-info">
                          <span className="patient-name">{patient.name}</span>
                          {patient.notes && (
                            <span className="patient-notes">{patient.notes.slice(0, 40)}{patient.notes.length > 40 ? '...' : ''}</span>
                          )}
                        </div>
                      </div>
                      <div className="col-contact">
                        <a href={`tel:${patient.phone}`} className="contact-item">
                          <Phone size={14} />
                          {patient.phone}
                        </a>
                        {patient.email && (
                          <a href={`mailto:${patient.email}`} className="contact-item">
                            <Mail size={14} />
                            {patient.email}
                          </a>
                        )}
                      </div>
                      <div className="col-cpf mono">{patient.cpf}</div>
                      <div className="col-age">
                        <span className="age-badge">{calculateAge(patient.birthDate)}</span>
                      </div>
                      <div className="col-actions">
                        <button 
                          className="action-btn action-btn--edit"
                          onClick={() => handleEdit(patient)}
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          className="action-btn action-btn--delete"
                          onClick={() => setDeleteConfirm(patient)}
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="patient-list__pagination">
                <button 
                  className="pagination-btn"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="pagination-info mono">
                  {currentPage} de {totalPages}
                </span>
                <button 
                  className="pagination-btn"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </motion.div>

      {showModal && (
        <PatientModal 
          patient={editingPatient}
          onClose={handleCloseModal}
        />
      )}

      {deleteConfirm && (
        <motion.div 
          className="confirm-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="confirm-dialog glass-card"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
          >
            <Trash2 size={48} className="confirm-dialog__icon" />
            <h3>Excluir Paciente?</h3>
            <p>Deseja excluir {deleteConfirm.name}? Esta ação não pode ser desfeita.</p>
            <div className="confirm-dialog__actions">
              <button onClick={() => setDeleteConfirm(null)} className="btn btn--secondary">
                Cancelar
              </button>
              <button onClick={() => handleDelete(deleteConfirm.id)} className="btn btn--danger">
                Sim, Excluir
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

export default PatientList
