import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Copy, KeyRound, RefreshCcw, ShieldCheck, X } from 'lucide-react'
import { useApp } from '../../App'
import '../Modal/Modal.css'
import './AdminTokenModal.css'

const formatTokenDate = (value) => {
  if (!value) {
    return 'Nao informado'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'Nao informado'
  }

  return date.toLocaleString('pt-BR')
}

function AdminTokenModal({ onClose }) {
  const { adminTokenDetails, loadAdminTokenDetails, regenerateAdminToken, addToast } = useApp()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    const bootstrap = async () => {
      try {
        setLoading(true)
        setError('')
        await loadAdminTokenDetails()
      } catch (requestError) {
        if (active) {
          setError(requestError.message || 'Nao foi possivel carregar o token')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void bootstrap()

    return () => {
      active = false
    }
  }, [loadAdminTokenDetails])

  const handleCopy = async () => {
    try {
      if (!adminTokenDetails?.token) {
        throw new Error('Token indisponivel')
      }

      await navigator.clipboard.writeText(adminTokenDetails.token)
      addToast('Token copiado para a area de transferencia', 'success')
    } catch (copyError) {
      addToast(copyError.message || 'Nao foi possivel copiar o token', 'error')
    }
  }

  const handleRegenerate = async () => {
    const confirmed = window.confirm('Gerar um novo token invalida o token atual. Deseja continuar?')
    if (!confirmed) {
      return
    }

    try {
      setSubmitting(true)
      setError('')
      await regenerateAdminToken()
      addToast('Novo token administrativo gerado', 'success')
    } catch (requestError) {
      setError(requestError.message || 'Nao foi possivel gerar um novo token')
    } finally {
      setSubmitting(false)
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
        className="modal admin-token-modal glass-card"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal__header">
          <h2>Token Administrativo</h2>
          <button className="modal__close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal__form">
          <div className="admin-token__intro">
            <div className="admin-token__badge">
              <ShieldCheck size={18} />
              <span>Token fixo do painel</span>
            </div>
            <p>Esse token permanece o mesmo ate voce gerar outro manualmente.</p>
          </div>

          <div className="admin-token__card">
            <div className="admin-token__label">
              <KeyRound size={16} />
              <span>Token atual</span>
            </div>

            {loading ? (
              <div className="admin-token__loading">Carregando token...</div>
            ) : (
              <>
                <code className="admin-token__value mono">
                  {adminTokenDetails?.token || 'Token indisponivel'}
                </code>
                <div className="admin-token__meta">
                  <span>Criado em</span>
                  <strong>{formatTokenDate(adminTokenDetails?.tokenCreatedAt)}</strong>
                </div>
              </>
            )}
          </div>

          {error && <div className="form__error">{error}</div>}

          <div className="modal__actions">
            <button type="button" className="btn btn--secondary" onClick={handleCopy} disabled={loading || submitting}>
              <Copy size={16} />
              Copiar token
            </button>
            <button type="button" className="btn btn--warning" onClick={() => void handleRegenerate()} disabled={loading || submitting}>
              <RefreshCcw size={16} />
              {submitting ? 'Gerando...' : 'Gerar novo token'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default AdminTokenModal
