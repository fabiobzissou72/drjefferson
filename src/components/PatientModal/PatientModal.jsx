import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, User, Phone, Mail, Calendar, FileText, AlertCircle, MapPin, CreditCard, Pill, Upload, Download, Trash2, Paperclip } from 'lucide-react'
import { useApp } from '../../App'
import { PLAN_TYPES, CITIES, calculateConsultationDates, formatPlanPrice } from '../../lib/planTypes'
import '../Modal/Modal.css'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const STORAGE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const EXAMES_BUCKET = 'patient-exams'

async function storageRequest(method, path, options = {}) {
  const { headers: extraHeaders = {}, ...rest } = options
  const url = `${SUPABASE_URL}/storage/v1${path}`
  const res = await fetch(url, {
    method,
    ...rest,
    headers: {
      apikey: STORAGE_KEY,
      Authorization: `Bearer ${STORAGE_KEY}`,
      ...extraHeaders
    }
  })
  return res
}

async function listPatientFiles(patientId) {
  const res = await storageRequest('POST', `/object/list/${EXAMES_BUCKET}`, {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefix: `${patientId}/`, limit: 100, sortBy: { column: 'created_at', order: 'desc' } })
  })
  if (!res.ok) return []
  return res.json()
}

async function uploadPatientFile(patientId, file) {
  const path = `${patientId}/${Date.now()}_${file.name}`
  const res = await storageRequest('POST', `/object/${EXAMES_BUCKET}/${path}`, {
    headers: { 'Content-Type': file.type || 'application/octet-stream', 'x-upsert': 'true' },
    body: file
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Falha no upload')
  }
  return path
}

async function deletePatientFile(path) {
  const res = await storageRequest('DELETE', `/object/${EXAMES_BUCKET}`, {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefixes: [path] })
  })
  return res.ok
}

async function downloadFile(path, filename) {
  const res = await storageRequest('GET', `/object/${EXAMES_BUCKET}/${path}`)
  if (!res.ok) return
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function PatientModal({ patient, onClose, onSave }) {
  const { addPatient, updatePatient } = useApp()
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    phone: '',
    email: '',
    birthDate: '',
    notes: '',
    city: '',
    planType: '',
    planStartDate: '',
    consultation1Date: '',
    consultation2Date: '',
    consultation3Date: '',
    protocoloMonjaro: false,
    observations: ''
  })
  const [errors, setErrors] = useState({})
  const [searchTerm, setSearchTerm] = useState('')
  const [examFiles, setExamFiles] = useState([])
  const [examLoading, setExamLoading] = useState(false)
  const [examUploading, setExamUploading] = useState(false)
  const [prontuario, setProntuario] = useState('')
  const [prontuarioSaving, setProntuarioSaving] = useState(false)
  const [prontuarioSaved, setProntuarioSaved] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (patient?.id) {
      setExamLoading(true)
      listPatientFiles(patient.id).then(files => {
        setExamFiles(files || [])
        setExamLoading(false)
      }).catch(() => setExamLoading(false))
      setProntuario(patient.observations || '')
    }
  }, [patient?.id])

  const saveProntuario = async () => {
    if (!patient?.id) return
    setProntuarioSaving(true)
    setProntuarioSaved(false)
    try {
      const result = await updatePatient({ ...patient, observations: prontuario })
      if (result) {
        setProntuarioSaved(true)
        setTimeout(() => setProntuarioSaved(false), 3000)
      }
    } finally {
      setProntuarioSaving(false)
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !patient?.id) return
    setExamUploading(true)
    try {
      await uploadPatientFile(patient.id, file)
      const files = await listPatientFiles(patient.id)
      setExamFiles(files || [])
    } catch (err) {
      console.error('Upload erro:', err)
    } finally {
      setExamUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDeleteFile = async (filePath) => {
    if (!window.confirm('Excluir este arquivo?')) return
    await deletePatientFile(filePath)
    setExamFiles(prev => prev.filter(f => `${patient.id}/${f.name}` !== filePath))
  }

  useEffect(() => {
    if (patient) {
      setFormData({
        name: patient.name || '',
        cpf: patient.cpf || '',
        phone: patient.phone || '',
        email: patient.email || '',
        birthDate: patient.birthDate || '',
        notes: patient.notes || '',
        city: patient.city || '',
        planType: patient.planType || '',
        planStartDate: patient.planStartDate || '',
        consultation1Date: patient.consultation1Date || '',
        consultation2Date: patient.consultation2Date || '',
        consultation3Date: patient.consultation3Date || '',
        protocoloMonjaro: patient.protocoloMonjaro || false,
        observations: patient.observations || ''
      })
    }
  }, [patient])

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório'
    }
    
    if (!formData.cpf.trim()) {
      newErrors.cpf = 'CPF é obrigatório'
    } else if (!/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(formData.cpf)) {
      newErrors.cpf = 'CPF inválido (formato: 000.000.000-00)'
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório'
    } else if (!/^\(\d{2}\)\s?\d{4,5}-\d{4}$/.test(formData.phone)) {
      newErrors.phone = 'Telefone inválido'
    }
    
    if (!formData.city) {
      newErrors.city = 'Cidade é obrigatória'
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const formatCPF = (value) => {
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 11) {
      return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, (match, p1, p2, p3, p4) => {
        if (p4) return `${p1}.${p2}.${p3}-${p4}`
        if (p3) return `${p1}.${p2}.${p3}`
        if (p2) return `${p1}.${p2}`
        return p1
      })
    }
    return value
  }

  const formatPhone = (value) => {
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 11) {
      return digits.replace(/^(\d{2})(\d{4,5})(\d{4})$/, (match, ddd, prefix, suffix) => {
        if (prefix.length === 5) {
          return `(${ddd}) ${prefix}-${suffix}`
        }
        return `(${ddd}) ${prefix}-${suffix}`
      })
    }
    return value
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    let formattedValue = type === 'checkbox' ? checked : value
    
    if (name === 'cpf') {
      formattedValue = formatCPF(value)
    } else if (name === 'phone') {
      formattedValue = formatPhone(value)
    }
    
    // Se mudou a data de início do plano, recalcular as datas das consultas
    if (name === 'planStartDate' && value) {
      const dates = calculateConsultationDates(value)
      setFormData(prev => ({ 
        ...prev, 
        [name]: formattedValue,
        ...dates
      }))
    } else {
      setFormData(prev => ({ ...prev, [name]: formattedValue }))
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    const savedPatient = patient
      ? await updatePatient({ ...patient, ...formData })
      : await addPatient(formData)

    if (savedPatient) {
      onClose()
    }
  }

  return (
    <motion.div 
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className="modal glass-card"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.2 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal__header">
          <h2>{patient ? 'Editar Paciente' : 'Novo Paciente'}</h2>
          <button className="modal__close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form className="modal__form" onSubmit={handleSubmit}>
          <div className="form__group">
            <label>
              <User size={16} />
              Nome Completo *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Digite o nome completo"
              className={errors.name ? 'error' : ''}
            />
            {errors.name && <span className="form__error"><AlertCircle size={14} /> {errors.name}</span>}
          </div>

          <div className="form__row">
            <div className="form__group">
              <label>
                <FileText size={16} />
                CPF *
              </label>
              <input
                type="text"
                name="cpf"
                value={formData.cpf}
                onChange={handleChange}
                placeholder="000.000.000-00"
                maxLength={14}
                className={errors.cpf ? 'error' : ''}
              />
              {errors.cpf && <span className="form__error"><AlertCircle size={14} /> {errors.cpf}</span>}
            </div>

            <div className="form__group">
              <label>
                <Calendar size={16} />
                Data de Nascimento
              </label>
              <input
                type="date"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form__row">
            <div className="form__group">
              <label>
                <Phone size={16} />
                Telefone *
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="(00) 00000-0000"
                maxLength={15}
                className={errors.phone ? 'error' : ''}
              />
              {errors.phone && <span className="form__error"><AlertCircle size={14} /> {errors.phone}</span>}
            </div>

            <div className="form__group">
              <label>
                <Mail size={16} />
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="email@exemplo.com"
                className={errors.email ? 'error' : ''}
              />
              {errors.email && <span className="form__error"><AlertCircle size={14} /> {errors.email}</span>}
            </div>
          </div>

          <div className="form__group">
            <label>
              <FileText size={16} />
              Observações Médicas
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Observações médicas sobre o paciente..."
              rows={2}
            />
          </div>

          <div className="form__divider" style={{ margin: '20px 0', borderTop: '1px solid rgba(255,255,255,0.1)' }}></div>

          <h3 style={{ fontSize: '16px', marginBottom: '15px', color: 'rgba(255,255,255,0.9)' }}>
            <CreditCard size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
            Informações do Plano
          </h3>

          <div className="form__row">
            <div className="form__group">
              <label>
                <MapPin size={16} />
                Cidade de Atendimento *
              </label>
              <select
                name="city"
                value={formData.city}
                onChange={handleChange}
                className={errors.city ? 'error' : ''}
              >
                <option value="">Selecione a cidade</option>
                {CITIES.map(city => (
                  <option key={city.value} value={city.value}>
                    {city.label}
                  </option>
                ))}
              </select>
              {errors.city && <span className="error-message">{errors.city}</span>}
            </div>

            <div className="form__group">
              <label>
                <CreditCard size={16} />
                Plano Contratado
              </label>
              <select
                name="planType"
                value={formData.planType}
                onChange={handleChange}
              >
                <option value="">Selecione o plano</option>
                {Object.values(PLAN_TYPES).map(plan => (
                  <option key={plan.id} value={plan.id}>
                    {plan.label} - {formatPlanPrice(plan.price)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {formData.planType && PLAN_TYPES[formData.planType]?.consultations === 3 && (
            <>
              <div className="form__group">
                <label>
                  <Calendar size={16} />
                  Data de Início do Plano
                </label>
                <input
                  type="date"
                  name="planStartDate"
                  value={formData.planStartDate}
                  onChange={handleChange}
                />
                <small style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  As datas das 3 consultas serão calculadas automaticamente (1 por mês)
                </small>
              </div>

              {formData.planStartDate && (
                <div className="form__row" style={{ gap: '10px' }}>
                  <div className="form__group">
                    <label>1ª Consulta</label>
                    <input
                      type="date"
                      name="consultation1Date"
                      value={formData.consultation1Date}
                      onChange={handleChange}
                      style={{ fontSize: '13px' }}
                    />
                  </div>
                  <div className="form__group">
                    <label>2ª Consulta</label>
                    <input
                      type="date"
                      name="consultation2Date"
                      value={formData.consultation2Date}
                      onChange={handleChange}
                      style={{ fontSize: '13px' }}
                    />
                  </div>
                  <div className="form__group">
                    <label>3ª Consulta</label>
                    <input
                      type="date"
                      name="consultation3Date"
                      value={formData.consultation3Date}
                      onChange={handleChange}
                      style={{ fontSize: '13px' }}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          <div className="form__row">
            <div className="form__group">
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  name="protocoloMonjaro"
                  checked={formData.protocoloMonjaro}
                  onChange={handleChange}
                  style={{ marginRight: '8px', width: 'auto', cursor: 'pointer' }}
                />
                <Pill size={16} style={{ marginRight: '6px' }} />
                Protocolo Monjaro
              </label>
            </div>
          </div>

          {patient?.id && (
            <>
              <div className="form__divider" style={{ margin: '20px 0', borderTop: '1px solid rgba(255,255,255,0.1)' }}></div>
              <h3 style={{ fontSize: '16px', marginBottom: '12px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} />
                Prontuário Clínico
              </h3>
              <div style={{ marginBottom: '20px' }}>
                <textarea
                  value={prontuario}
                  onChange={e => setProntuario(e.target.value)}
                  placeholder="Anotações clínicas, evolução do paciente, histórico, observações médicas..."
                  rows={6}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'var(--bg-glass)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    outline: 'none',
                    display: 'block'
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={saveProntuario}
                    disabled={prontuarioSaving}
                    style={{
                      padding: '8px 16px',
                      background: prontuarioSaved ? '#5ea58b' : 'var(--primary)',
                      color: '#1f1a13',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    {prontuarioSaving ? 'Salvando...' : prontuarioSaved ? 'Salvo!' : 'Salvar Prontuário'}
                  </button>
                </div>
              </div>

              <h3 style={{ fontSize: '16px', marginBottom: '15px', color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Paperclip size={18} />
                Exames e Documentos
              </h3>
              <div style={{ marginBottom: '12px' }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={examUploading}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}
                >
                  <Upload size={16} />
                  {examUploading ? 'Enviando...' : 'Enviar arquivo'}
                </button>
              </div>
              {examLoading ? (
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>Carregando arquivos...</p>
              ) : examFiles.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>Nenhum arquivo enviado</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {examFiles.map(file => {
                    const filePath = `${patient.id}/${file.name}`
                    const displayName = file.name.replace(/^\d+_/, '')
                    return (
                      <div key={file.name} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <Paperclip size={14} style={{ flexShrink: 0, color: 'rgba(255,255,255,0.5)' }} />
                        <span style={{ flex: 1, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</span>
                        <button
                          type="button"
                          title="Baixar"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5ea58b', display: 'flex', alignItems: 'center', padding: '0' }}
                          onClick={() => downloadFile(filePath, displayName)}
                        >
                          <Download size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteFile(filePath)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c0392b', display: 'flex', alignItems: 'center', padding: '0' }}
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}

          <div className="modal__actions">
            <button type="button" className="btn btn--secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn--primary">
              {patient ? 'Salvar Alterações' : 'Cadastrar Paciente'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default PatientModal
