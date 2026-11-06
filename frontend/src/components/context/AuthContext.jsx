import { createContext, useContext, useEffect, useState } from 'react'
import * as authService from '../services/authService'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // restore the session when the app loads
  useEffect(() => {
    authService
      .fetchCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const register = async (data) => {
    const newUser = await authService.registerUser(data)
    setUser(newUser)
    return newUser
  }

  const login = async (data) => {
    const loggedIn = await authService.loginUser(data)
    setUser(loggedIn)
    return loggedIn
  }

  const logout = async () => {
    await authService.logoutUser()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}