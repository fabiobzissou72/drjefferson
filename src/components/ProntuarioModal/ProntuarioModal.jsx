import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { X, Phone, Calendar, MapPin, CreditCard, FileText, Paperclip, Download, Pill, Save, Upload, Trash2 } from 'lucide-react'
import { useApp } from '../../App'
import { getPlanLabel, formatDateDisplay } from '../../lib/planTypes'
import './ProntuarioModal.css'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const STORAGE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const EXAMES_BUCKET = 'patient-exams'

async function storageRequest(method, path, options = {}) {
  const { headers: extraHeaders = {}, ...rest } = options
  const res = await fetch(`${SUPABASE_URL}/storage/v1${path}`, {
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

async function listFiles(patientId) {
  const res = await storageRequest('POST', `/object/list/${EXAMES_BUCKET}`, {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefix: `${patientId}/`, limit: 100, sortBy: { column: 'created_at', order: 'desc' } })
  })
  if (!res.ok) return []
  return res.json()
}

async function uploadFile(patientId, file) {
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

async function deleteFile(path) {
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

function formatAge(birthDate) {
  if (!birthDate) return null
  const birth = new Date(birthDate + 'T00:00:00')
  const now = new Date()
  const years = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  return m < 0 || (m === 0 && now.getDate() < birth.getDate()) ? years - 1 : years
}

function ProntuarioModal({ patient, onClose }) {
  const { updatePatient } = useApp()
  const [files, setFiles] = useState([])
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (patient?.id) {
      listFiles(patient.id).then(f => setFiles(f || [])).catch(() => {})
      setNotes(patient.observations || '')
    }
  }, [patient?.id])

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !patient?.id) return
    setUploading(true)
    try {
      await uploadFile(patient.id, file)
      const updated = await listFiles(patient.id)
      setFiles(updated || [])
    } catch (err) {
      console.error('Upload erro:', err)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDelete = async (filePath) => {
    if (!window.confirm('Excluir este arquivo?')) return
    await deleteFile(filePath)
    setFiles(prev => prev.filter(f => `${patient.id}/${f.name}` !== filePath))
  }

  const saveNotes = async () => {
    if (!patient?.id) return
    setSaving(true)
    setSaved(false)
    try {
      const result = await updatePatient({ ...patient, observations: notes })
      if (result) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } finally {
      setSaving(false)
    }
  }

  if (!patient) return null

  const age = formatAge(patient.birthDate)
  const planLabel = patient.planType ? getPlanLabel(patient.planType) : null

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="modal"
        style={{
          maxWidth: '700px',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--bg-card-solid)',
          border: '1px solid var(--border)',
          borderRadius: '24px',
          padding: '28px'
        }}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #c7a46a, #8f6f4a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '20px', fontWeight: '800', color: '#1f1a13', flexShrink: 0
            }}>
              {patient.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '2px', color: 'var(--text-primary)' }}>{patient.name}</h2>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Prontuário Clínico</span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Info grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
          {patient.phone && (
            <div className="pront__info-box">
              <span className="pront__info-label"><Phone size={13} /> Telefone</span>
              <span className="pront__info-value">{patient.phone}</span>
            </div>
          )}
          {patient.birthDate && (
            <div className="pront__info-box">
              <span className="pront__info-label"><Calendar size={13} /> Nascimento</span>
              <span className="pront__info-value">{formatDateDisplay(patient.birthDate)}{age !== null ? ` · ${age} anos` : ''}</span>
            </div>
          )}
          {patient.city && (
            <div className="pront__info-box">
              <span className="pront__info-label"><MapPin size={13} /> Cidade</span>
              <span className="pront__info-value">{patient.city}</span>
            </div>
          )}
          {planLabel && (
            <div className="pront__info-box">
              <span className="pront__info-label"><CreditCard size={13} /> Plano</span>
              <span className="pront__info-value">{planLabel}</span>
            </div>
          )}
          {patient.consultation1Date && (
            <div className="pront__info-box">
              <span className="pront__info-label"><Calendar size={13} /> Consulta 1</span>
              <span className="pront__info-value">{formatDateDisplay(patient.consultation1Date)}</span>
            </div>
          )}
          {patient.consultation2Date && (
            <div className="pront__info-box">
              <span className="pront__info-label"><Calendar size={13} /> Consulta 2</span>
              <span className="pront__info-value">{formatDateDisplay(patient.consultation2Date)}</span>
            </div>
          )}
          {patient.consultation3Date && (
            <div className="pront__info-box">
              <span className="pront__info-label"><Calendar size={13} /> Consulta 3</span>
              <span className="pront__info-value">{formatDateDisplay(patient.consultation3Date)}</span>
            </div>
          )}
          {patient.protocoloMonjaro && (
            <div className="pront__info-box pront__info-box--monjaro" style={{ gridColumn: 'span 2' }}>
              <span className="pront__info-label" style={{ color: '#8b5cf6' }}><Pill size={13} /> Protocolo Monjaro ativo</span>
            </div>
          )}
        </div>

        {/* Prontuário — editável */}
        <div style={{ marginBottom: '24px' }}>
          <h3 className="pront__section-title"><FileText size={16} /> Prontuário / Anotações Clínicas</h3>
          <textarea
            className="pront__textarea"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Anotações clínicas, evolução do paciente, histórico médico..."
            rows={7}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button
              onClick={saveNotes}
              disabled={saving}
              className={`pront__save-btn${saved ? ' pront__save-btn--saved' : ''}`}
            >
              <Save size={14} />
              {saving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar'}
            </button>
          </div>
        </div>

        {/* Arquivos */}
        <div>
          <h3 className="pront__section-title"><Paperclip size={16} /> Exames e Documentos</h3>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            onChange={handleUpload}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="pront__save-btn"
            style={{ marginBottom: '12px' }}
          >
            <Upload size={14} />
            {uploading ? 'Enviando...' : 'Enviar arquivo'}
          </button>
          {files.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {files.map(file => {
                const filePath = `${patient.id}/${file.name}`
                const displayName = file.name.replace(/^\d+_/, '')
                return (
                  <div key={file.name} className="pront__file-row">
                    <Paperclip size={14} className="pront__file-icon" />
                    <span className="pront__file-name">{displayName}</span>
                    <button
                      onClick={() => downloadFile(filePath, displayName)}
                      className="pront__file-download"
                      title="Baixar"
                    >
                      <Download size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(filePath)}
                      className="pront__file-download"
                      title="Excluir"
                      style={{ color: '#c0392b' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
          {files.length === 0 && !uploading && (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Nenhum arquivo enviado</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}


export default ProntuarioModal
