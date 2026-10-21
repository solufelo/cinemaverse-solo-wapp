import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'

const AuthContext = createContext(null)

/** Session lives in an HttpOnly cookie; the client only ever asks the server who it is. */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const { user } = await api('/auth/me')
      setUser(user)
      return user
    } catch {
      setUser(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const value = useMemo(
    () => ({
      user,
      loading,
      refresh,
      async signUp(fields) {
        await api('/auth/signup', { method: 'POST', body: fields })
        return refresh()
      },
      async signIn(fields) {
        await api('/auth/login', { method: 'POST', body: fields })
        return refresh()
      },
      async startDemo() {
        await api('/auth/demo', { method: 'POST' })
        return refresh()
      },
      async signOut() {
        await api('/auth/logout', { method: 'POST' }).catch(() => {})
        setUser(null)
      },
    }),
    [user, loading, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
