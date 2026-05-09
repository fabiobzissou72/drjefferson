import { useState } from 'react'
import { motion } from 'framer-motion'
import { LockKeyhole, Mail, UserPlus, LogIn } from 'lucide-react'
import './AdminLogin.css'

function AdminLogin({ onLogin, onRegister, loading = false, error = '', success = '' }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [localError, setLocalError] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    setLocalError('')

    if (mode === 'register') {
      if (password !== confirmPassword) {
        setLocalError('As senhas não coincidem')
        return
      }
      if (password.length < 6) {
        setLocalError('A senha deve ter no mínimo 6 caracteres')
        return
      }
      onRegister({ email, password })
    } else {
      onLogin({ email, password })
    }
  }

  const switchMode = (newMode) => {
    setMode(newMode)
    setLocalError('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
  }

  const displayError = localError || error

  return (
    <div className="admin-login">
      <motion.div
        className="admin-login__panel glass-card"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="admin-login__hero">
          <h1>{mode === 'login' ? 'Acesso medico' : 'Criar conta'}</h1>
          <p>{mode === 'login' ? 'Entre com email e senha.' : 'Cadastre um novo acesso.'}</p>
        </div>

        <div className="admin-login__tabs">
          <button
            type="button"
            className={`admin-login__tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => switchMode('login')}
          >
            <LogIn size={15} />
            Entrar
          </button>
          <button
            type="button"
            className={`admin-login__tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => switchMode('register')}
          >
            <UserPlus size={15} />
            Cadastrar
          </button>
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
                placeholder="email@exemplo.com"
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
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                required
              />
            </div>
          </label>

          {mode === 'register' && (
            <label className="admin-login__field">
              <span>Confirmar senha</span>
              <div className="admin-login__input">
                <LockKeyhole size={18} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Repita a senha"
                  autoComplete="new-password"
                  required
                />
              </div>
            </label>
          )}

          {displayError && <div className="admin-login__error">{displayError}</div>}
          {success && <div className="admin-login__success">{success}</div>}

          <button type="submit" className="admin-login__submit" disabled={loading}>
            {loading
              ? (mode === 'register' ? 'Cadastrando...' : 'Entrando...')
              : (mode === 'register' ? 'Criar conta' : 'Entrar no painel')}
          </button>
        </form>
      </motion.div>
    </div>
  )
}

export default AdminLogin
