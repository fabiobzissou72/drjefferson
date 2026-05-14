import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus, Edit2, Trash2, Phone, Mail, Calendar, ChevronLeft, ChevronRight, UserX, MapPin, CreditCard, Pill, AlertCircle, ClipboardList } from 'lucide-react'
import { useApp } from '../../App'
import { isBlockedPatient } from '../../lib/blockedAppointments'
import { matchesPatientSearch } from '../../lib/patientSearch'
import { getPlanLabel, formatDateDisplay, getConsultationDateStatus, getDateStatusColor, getDateStatusLabel } from '../../lib/planTypes'
import PatientModal from '../PatientModal/PatientModal'
import ProntuarioModal from '../ProntuarioModal/ProntuarioModal'
import './PatientList.css'

function PatientList() {
  const { patients, deletePatient, addToast } = useApp()
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingPatient, setEditingPatient] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [prontuarioPatient, setProntuarioPatient] = useState(null)
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
            <div className="patient-table" style={{ overflowX: 'auto' }}>
              <div className="patient-table__header" style={{ display: 'grid', gridTemplateColumns: '200px 150px 120px 180px 100px 100px 100px 100px 80px 80px 100px', gap: '10px', minWidth: '1400px' }}>
                <div>Paciente</div>
                <div>Telefone</div>
                <div>Cidade</div>
                <div>Plano</div>
                <div>Início</div>
                <div>1ª Consulta</div>
                <div>2ª Consulta</div>
                <div>3ª Consulta</div>
                <div>Monjaro</div>
                <div>Idade</div>
                <div>Ações</div>
              </div>
              <div className="patient-table__body">
                <AnimatePresence mode="popLayout">
                  {paginatedPatients.map((patient, index) => {
                    const date1Status = getConsultationDateStatus(patient.consultation1Date)
                    const date2Status = getConsultationDateStatus(patient.consultation2Date)
                    const date3Status = getConsultationDateStatus(patient.consultation3Date)
                    
                    return (
                      <motion.div 
                        key={patient.id}
                        className="patient-table__row"
                        style={{ display: 'grid', gridTemplateColumns: '200px 150px 120px 180px 100px 100px 100px 100px 80px 80px 100px', gap: '10px', minWidth: '1400px', alignItems: 'center' }}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div className="patient-avatar" style={{ flexShrink: 0 }}>
                            {(patient.name || '?').split(' ').filter(n => n).map(n => n[0]).slice(0, 2).join('') || '?'}
                          </div>
                          <div style={{ overflow: 'hidden' }}>
                            <div className="patient-name" style={{ fontSize: '14px', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {patient.name}
                            </div>
                            {patient.observations && (
                              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {patient.observations.slice(0, 30)}{patient.observations.length > 30 ? '...' : ''}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <a href={`tel:${patient.phone}`} className="contact-item" style={{ fontSize: '13px' }}>
                            <Phone size={12} />
                            {patient.phone}
                          </a>
                        </div>
                        
                        <div style={{ fontSize: '13px' }}>
                          {patient.city ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <MapPin size={12} />
                              {patient.city}
                            </span>
                          ) : '-'}
                        </div>
                        
                        <div style={{ fontSize: '12px' }}>
                          {patient.planType ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'rgba(255,255,255,0.8)' }}>
                              <CreditCard size={12} />
                              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {getPlanLabel(patient.planType).replace('Plano ', '').replace('Consulta ', '')}
                              </span>
                            </span>
                          ) : '-'}
                        </div>
                        
                        <div style={{ fontSize: '12px', fontFamily: 'monospace' }}>
                          {formatDateDisplay(patient.planStartDate)}
                        </div>
                        
                        <div style={{ fontSize: '12px' }}>
                          {patient.consultation1Date ? (
                            <div style={{ 
                              display: 'inline-block',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              backgroundColor: getDateStatusColor(date1Status) + '20',
                              border: `1px solid ${getDateStatusColor(date1Status)}`,
                              fontSize: '11px',
                              fontFamily: 'monospace'
                            }}>
                              {formatDateDisplay(patient.consultation1Date)}
                            </div>
                          ) : '-'}
                        </div>
                        
                        <div style={{ fontSize: '12px' }}>
                          {patient.consultation2Date ? (
                            <div style={{ 
                              display: 'inline-block',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              backgroundColor: getDateStatusColor(date2Status) + '20',
                              border: `1px solid ${getDateStatusColor(date2Status)}`,
                              fontSize: '11px',
                              fontFamily: 'monospace'
                            }}>
                              {formatDateDisplay(patient.consultation2Date)}
                            </div>
                          ) : '-'}
                        </div>
                        
                        <div style={{ fontSize: '12px' }}>
                          {patient.consultation3Date ? (
                            <div style={{ 
                              display: 'inline-block',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              backgroundColor: getDateStatusColor(date3Status) + '20',
                              border: `1px solid ${getDateStatusColor(date3Status)}`,
                              fontSize: '11px',
                              fontFamily: 'monospace'
                            }}>
                              {formatDateDisplay(patient.consultation3Date)}
                            </div>
                          ) : '-'}
                        </div>
                        
                        <div style={{ textAlign: 'center' }}>
                          {patient.protocoloMonjaro ? (
                            <span style={{ 
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              backgroundColor: '#8b5cf6',
                              color: 'white'
                            }} title="Protocolo Monjaro">
                              <Pill size={14} />
                            </span>
                          ) : (
                            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>-</span>
                          )}
                        </div>
                        
                        <div style={{ textAlign: 'center' }}>
                          <span className="age-badge">{calculateAge(patient.birthDate)}</span>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                          <button
                            className="action-btn"
                            onClick={() => setProntuarioPatient(patient)}
                            title="Ver Prontuário"
                            style={{ color: '#5ea58b' }}
                          >
                            <ClipboardList size={14} />
                          </button>
                          <button
                            className="action-btn action-btn--edit"
                            onClick={() => handleEdit(patient)}
                            title="Editar"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            className="action-btn action-btn--delete"
                            onClick={() => setDeleteConfirm(patient)}
                            title="Excluir"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </motion.div>
                    )
                  })}
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

      {prontuarioPatient && (
        <ProntuarioModal
          patient={prontuarioPatient}
          onClose={() => setProntuarioPatient(null)}
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
