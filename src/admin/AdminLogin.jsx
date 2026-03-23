import { useState } from 'react'
import { motion } from 'framer-motion'
import { LockKeyhole, Mail } from 'lucide-react'
import './AdminLogin.css'

function AdminLogin({ onLogin, loading = false, error = '' }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    onLogin({ email, password })
  }

  return (
    <div className="admin-login">
      <motion.div
        className="admin-login__panel glass-card"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="admin-login__hero">
          <h1>Acesso medico</h1>
          <p>Entre com email e senha.</p>
        </div>

        <form className="admin-login__form" onSubmit={handleSubmit}>
          <label className="admin-login__field">
            <span>Email</span>
            <div className="admin-login__input">
              <Mail size={18} />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@drjefferson.local"
                autoComplete="username"
                required
              />
            </div>
          </label>

          <label className="admin-login__field">
            <span>Senha</span>
            <div className="admin-login__input">
              <LockKeyhole size={18} />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Digite sua senha"
                autoComplete="current-password"
                required
              />
            </div>
          </label>

          {error && <div className="admin-login__error">{error}</div>}

          <button type="submit" className="admin-login__submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar no painel'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}

export default AdminLogin
