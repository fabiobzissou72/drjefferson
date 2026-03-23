import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Phone, ArrowRight, Moon, Sun } from 'lucide-react'
import PatientDashboard from './PatientDashboard'
import './PatientLogin.css'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const PATIENT_PORTAL_THEME_KEY = 'drjefferson_patient_theme'

function PatientLogin() {
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [patient, setPatient] = useState(null)
  const [theme, setTheme] = useState(() => localStorage.getItem(PATIENT_PORTAL_THEME_KEY) || 'light')

  useEffect(() => {
    const previousTheme = document.documentElement.getAttribute('data-theme') || 'dark'
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(PATIENT_PORTAL_THEME_KEY, theme)

    return () => {
      document.documentElement.setAttribute('data-theme', previousTheme)
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme((currentTheme) => currentTheme === 'light' ? 'dark' : 'light')
  }

  const formatPhone = (value) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})/, '($1) $2')
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }

  const handlePhoneChange = (e) => {
    setPhone(formatPhone(e.target.value))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const cleanPhone = phone.replace(/\D/g, '')
    
    if (cleanPhone.length < 10) {
      setError('Digite um número de telefone válido')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/patients?select=*`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        }
      )

      if (!response.ok) {
        throw new Error('Erro ao buscar dados')
      }

      const data = await response.json()

      const patientFound = (data || []).find(p => {
        if (!p.phone) return false
        const patientPhone = p.phone.replace(/\D/g, '')
        return patientPhone.includes(cleanPhone) || cleanPhone.includes(patientPhone)
      })

      if (patientFound) {
        setPatient(patientFound)
      } else {
        setError('Paciente não encontrado. Entre em contato conosco.')
      }
    } catch (err) {
      setError('Erro ao verificar cadastro. Tente novamente.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (patient) {
    return (
      <PatientDashboard
        patient={patient}
        onLogout={() => setPatient(null)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    )
  }

  return (
    <div className="patient-login">
      <div className="patient-login__container">
        <motion.div 
          className="patient-login__card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="patient-login__header">
            <button
              type="button"
              className="patient-login__theme-toggle"
              onClick={toggleTheme}
              title={theme === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro'}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <span className="patient-login__doctor-name">Dr. Jefferson</span>
            <h1>Portal do Paciente</h1>
            <p>Digite seu número de celular para acessar</p>
          </div>

          <form onSubmit={handleSubmit} className="patient-login__form">
            <div className="patient-login__input-group">
              <Phone size={20} className="patient-login__icon" />
              <input
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="(11) 98765-4321"
                className="patient-login__input"
                maxLength={15}
                autoFocus
              />
            </div>

            {error && (
              <motion.p 
                className="patient-login__error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {error}
              </motion.p>
            )}

            <motion.button
              type="submit"
              className="patient-login__btn"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? 'Verificando...' : (
                <>
                  Entrar <ArrowRight size={18} />
                </>
              )}
            </motion.button>
          </form>

          <div className="patient-login__footer">
            <p>Agende sua consulta sem burocracia</p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default PatientLogin
