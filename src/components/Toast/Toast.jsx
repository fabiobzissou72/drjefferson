import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, AlertCircle, Info } from 'lucide-react'
import './Toast.css'

const icons = {
  success: Check,
  error: X,
  warning: AlertCircle,
  info: Info
}

const colors = {
  success: { bg: 'rgba(16, 185, 129, 0.15)', border: '#10b981', color: '#10b981' },
  error: { bg: 'rgba(239, 68, 68, 0.15)', border: '#ef4444', color: '#ef4444' },
  warning: { bg: 'rgba(245, 158, 11, 0.15)', border: '#f59e0b', color: '#f59e0b' },
  info: { bg: 'rgba(99, 102, 241, 0.15)', border: '#6366f1', color: '#6366f1' }
}

function Toast({ toasts }) {
  return (
    <div className="toast-container">
      <AnimatePresence mode="popLayout">
        {toasts.map(toast => {
          const Icon = icons[toast.type] || icons.info
          const style = colors[toast.type] || colors.info
          
          return (
            <motion.div
              key={toast.id}
              className="toast"
              style={{
                background: style.bg,
                borderColor: style.border
              }}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              layout
            >
              <div 
                className="toast__icon"
                style={{ color: style.color }}
              >
                <Icon size={18} />
              </div>
              <span className="toast__message">{toast.message}</span>
              <motion.div 
                className="toast__progress"
                style={{ background: style.border }}
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: 4, ease: 'linear' }}
              />
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

export default Toast
