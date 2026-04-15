const DEFAULT_API_BASE_URL = import.meta.env.DEV ? 'http://localhost:3005/api' : '/api'

export const ADMIN_TOKEN_STORAGE_KEY = 'drjefferson_admin_token'
export const ADMIN_USER_STORAGE_KEY = 'drjefferson_admin_user'
export const ADMIN_API_BASE_URL = (import.meta.env.VITE_API_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '')

export const loadStoredAdminSession = () => {
  if (typeof window === 'undefined') {
    return { token: '', admin: null }
  }

  try {
    const token = window.localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) || ''
    const adminRaw = window.localStorage.getItem(ADMIN_USER_STORAGE_KEY)
    const admin = adminRaw ? JSON.parse(adminRaw) : null

    return { token, admin }
  } catch {
    return { token: '', admin: null }
  }
}

export const persistAdminSession = (token, admin) => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token)
  window.localStorage.setItem(ADMIN_USER_STORAGE_KEY, JSON.stringify(admin))
}

export const clearAdminSession = () => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY)
  window.localStorage.removeItem(ADMIN_USER_STORAGE_KEY)
}
