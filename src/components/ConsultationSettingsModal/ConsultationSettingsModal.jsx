import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Plus, Trash2, Save, Video, Building2 } from 'lucide-react'
import { useApp } from '../../App'
import {
  createConsultationTypeDraft,
  formatConsultationDuration,
  formatConsultationPrice,
  getConsultationModeLabel,
  normalizeConsultationType,
  toConsultationPriceNumber
} from '../../lib/consultationTypes'
import '../Modal/Modal.css'
import './ConsultationSettingsModal.css'

function ConsultationSettingsModal({ onClose }) {
  const { consultationTypes, saveConsultationTypes } = useApp()
  const [draftTypes, setDraftTypes] = useState((consultationTypes || []).map(normalizeConsultationType))

  const updateType = (id, field, value) => {
    setDraftTypes((currentTypes) =>
      currentTypes.map((type) =>
        type.id === id
          ? {
              ...type,
              [field]: field === 'price' ? value : value
            }
          : type
      )
    )
  }

  const handleAdd = () => {
    setDraftTypes((currentTypes) => [...currentTypes, createConsultationTypeDraft()])
  }

  const handleRemove = (id) => {
    setDraftTypes((currentTypes) => currentTypes.filter((type) => type.id !== id))
  }

  const handleSave = async () => {
    const cleanedTypes = draftTypes
      .map((type) => normalizeConsultationType({
        ...type,
        label: (type.label || '').trim() || 'Consulta sem nome',
        durationMinutes: Number(type.durationMinutes || 60),
        price: toConsultationPriceNumber(type.price)
      }))

    await saveConsultationTypes(cleanedTypes)
    onClose()
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
        className="modal consultation-settings-modal glass-card"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal__header">
          <h2>Tipos de Consulta</h2>
          <button className="modal__close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal__form">
          <div className="consultation-settings__toolbar">
            <p>Defina quais consultas o medico oferece e quais valores aparecem no portal do paciente.</p>
            <button type="button" className="btn btn--secondary btn--sm" onClick={handleAdd}>
              <Plus size={16} />
              Nova consulta
            </button>
          </div>

          <div className="consultation-settings__list">
            {draftTypes.map((type) => (
              <div key={type.id} className="consultation-settings__card">
                <div className="consultation-settings__card-header">
                  <div className="consultation-settings__mode">
                    {type.mode === 'online' ? <Video size={16} /> : <Building2 size={16} />}
                    <span>{getConsultationModeLabel(type.mode)}</span>
                  </div>

                  <button
                    type="button"
                    className="consultation-settings__remove"
                    onClick={() => handleRemove(type.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="form__row">
                  <div className="form__group">
                    <label>Nome da consulta</label>
                    <input
                      type="text"
                      value={type.label}
                      onChange={(event) => updateType(type.id, 'label', event.target.value)}
                      placeholder="Ex.: Consulta de retorno"
                    />
                  </div>

                  <div className="form__group">
                    <label>Modalidade</label>
                    <select
                      value={type.mode}
                      onChange={(event) => updateType(type.id, 'mode', event.target.value)}
                    >
                      <option value="presential">Presencial</option>
                      <option value="online">Online</option>
                      <option value="mixed">Misto</option>
                    </select>
                  </div>
                </div>

                <div className="form__row">
                  <div className="form__group">
                    <label>Duracao em minutos</label>
                    <input
                      type="number"
                      min="15"
                      step="15"
                      value={type.durationMinutes}
                      onChange={(event) => updateType(type.id, 'durationMinutes', event.target.value)}
                    />
                  </div>

                  <div className="form__group">
                    <label>Valor</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={type.price}
                      onChange={(event) => updateType(type.id, 'price', event.target.value)}
                      placeholder="Ex.: 200,00"
                    />
                  </div>

                  <div className="form__group">
                    <label>Status</label>
                    <select
                      value={type.active ? 'active' : 'inactive'}
                      onChange={(event) => updateType(type.id, 'active', event.target.value === 'active')}
                    >
                      <option value="active">Ativa</option>
                      <option value="inactive">Oculta no portal</option>
                    </select>
                  </div>
                </div>

                <div className="consultation-settings__preview">
                  <span>{type.label}</span>
                  <strong>{getConsultationModeLabel(type.mode)} - {formatConsultationDuration(type.durationMinutes)} - {formatConsultationPrice(type.price)}</strong>
                </div>
              </div>
            ))}
          </div>

          <div className="modal__actions">
            <button type="button" className="btn btn--secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="button" className="btn btn--primary" onClick={() => void handleSave()}>
              <Save size={16} />
              Salvar tipos
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default ConsultationSettingsModal
