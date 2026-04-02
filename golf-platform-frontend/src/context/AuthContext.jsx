import { createContext, useEffect, useState } from 'react'
import api from '../api/axios'

export const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = async () => {
    const res = await api.get('/auth/me')
    setUser(res.data)
    return res.data
  }

  useEffect(() => {
    const token = localStorage.getItem('token')

    if (!token) {
      setLoading(false)
      return
    }

    refreshUser()
      .catch(() => {
        localStorage.removeItem('token')
        setUser(null)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    const { token, user } = res.data

    localStorage.setItem('token', token)
    setUser(user)

    return user
  }

  const register = async (payload) => {
    const res = await api.post('/auth/register', payload)
    const { token, user } = res.data

    localStorage.setItem('token', token)
    setUser(user)

    return user
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        refreshUser,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
