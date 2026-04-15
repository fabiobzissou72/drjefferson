import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, User, Phone, Mail, Calendar, FileText, AlertCircle } from 'lucide-react'
import { useApp } from '../../App'
import '../Modal/Modal.css'

function PatientModal({ patient, onClose, onSave }) {
  const { addPatient, updatePatient } = useApp()
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    phone: '',
    email: '',
    birthDate: '',
    notes: ''
  })
  const [errors, setErrors] = useState({})
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (patient) {
      setFormData({
        name: patient.name || '',
        cpf: patient.cpf || '',
        phone: patient.phone || '',
        email: patient.email || '',
        birthDate: patient.birthDate || '',
        notes: patient.notes || ''
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
    const { name, value } = e.target
    let formattedValue = value
    
    if (name === 'cpf') {
      formattedValue = formatCPF(value)
    } else if (name === 'phone') {
      formattedValue = formatPhone(value)
    }
    
    setFormData(prev => ({ ...prev, [name]: formattedValue }))
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
              Observações
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Observações sobre o paciente..."
              rows={3}
            />
          </div>

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
