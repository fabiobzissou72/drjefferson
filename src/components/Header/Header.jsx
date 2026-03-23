import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, LayoutDashboard, Sun, Moon, Lock, LogOut } from 'lucide-react'
import { useApp } from '../../App'
import './Header.css'

function Header() {
  const { currentView, setView, theme, setTheme, logoutAdmin, adminUser } = useApp()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navItems = [
    { id: 'dashboard', label: 'Agenda', icon: LayoutDashboard },
    { id: 'patients', label: 'Pacientes', icon: Users },
    { id: 'blocked', label: 'Bloqueios', icon: Lock }
  ]

  return (
    <header className={`header ${scrolled ? 'header--scrolled' : ''}`}>
      <div className="header__container">
        <motion.div
          className="header__logo"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="header__logo-text">
            <span className="header__logo-name">Dr. Jefferson</span>
          </div>
        </motion.div>

        <nav className="header__nav">
          {navItems.map((item, index) => (
            <motion.button
              key={item.id}
              className={`header__nav-item ${currentView === item.id ? 'active' : ''}`}
              onClick={() => setView(item.id)}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
              {currentView === item.id && (
                <motion.div
                  className="header__nav-indicator"
                  layoutId="navIndicator"
                />
              )}
            </motion.button>
          ))}
        </nav>

        <motion.div
          className="header__actions"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          {adminUser?.fullName && (
            <div className="header__session">
              <span className="header__session-label">Admin</span>
              <strong>{adminUser.fullName}</strong>
            </div>
          )}
          <div className="header__date">
            <span className="header__date-label">Hoje</span>
            <span className="mono">
              {new Date().toLocaleDateString('pt-BR')}
            </span>
          </div>
          <motion.button
            className="header__theme-toggle"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </motion.button>
          <motion.button
            className="header__logout"
            onClick={logoutAdmin}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.94 }}
            title="Sair do painel"
          >
            <LogOut size={18} />
          </motion.button>
        </motion.div>
      </div>
    </header>
  )
}

export default Header
