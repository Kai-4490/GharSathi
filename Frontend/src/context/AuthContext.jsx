import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { jwtDecode } from 'jwt-decode'
import { TOKEN_KEY, USER_KEY } from '../api/client'
import * as reportsApi from '../api/reports'

const AuthContext = createContext(null)

function readStored() {
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    const user = JSON.parse(localStorage.getItem(USER_KEY) || 'null')
    if (!token || !user) return { token: null, user: null }
    const { exp } = jwtDecode(token)
    if (exp * 1000 < Date.now()) throw new Error('expired')
    return { token, user }
  } catch {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    return { token: null, user: null }
  }
}

export function AuthProvider({ children }) {
  const [{ token, user }, setAuth] = useState(readStored)
  // Set of user ids that the logged-in user has blocked (blocks are not enforced server-side).
  const [blockedIds, setBlockedIds] = useState(() => new Set())

  const loadBlocked = useCallback(async (uid) => {
    try {
      const blocks = await reportsApi.blockedBy(uid)
      setBlockedIds(new Set(blocks.map((b) => b.blocked?.id).filter((x) => x != null)))
    } catch {
      /* non-fatal: filtering simply won't apply */
    }
  }, [])

  useEffect(() => {
    if (user?.id) loadBlocked(user.id)
    else setBlockedIds(new Set())
  }, [user?.id, loadBlocked])

  // If another tab / the interceptor clears storage, follow it.
  useEffect(() => {
    const onStorage = () => setAuth(readStored())
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const login = useCallback((newToken, newUser) => {
    localStorage.setItem(TOKEN_KEY, newToken)
    localStorage.setItem(USER_KEY, JSON.stringify(newUser))
    setAuth({ token: newToken, user: newUser })
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setAuth({ token: null, user: null })
    setBlockedIds(new Set())
  }, [])

  const updateStoredUser = useCallback((newUser) => {
    localStorage.setItem(USER_KEY, JSON.stringify(newUser))
    setAuth((a) => ({ ...a, user: newUser }))
  }, [])

  const addBlocked = useCallback((id) => setBlockedIds((s) => new Set(s).add(id)), [])
  const removeBlocked = useCallback(
    (id) =>
      setBlockedIds((s) => {
        const n = new Set(s)
        n.delete(id)
        return n
      }),
    [],
  )

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthed: !!token && !!user,
      blockedIds,
      isBlocked: (id) => blockedIds.has(id),
      login,
      logout,
      updateStoredUser,
      addBlocked,
      removeBlocked,
      reloadBlocked: () => user && loadBlocked(user.id),
    }),
    [user, token, blockedIds, login, logout, updateStoredUser, addBlocked, removeBlocked, loadBlocked],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

export const homeFor = (role) => (role === 'ADMIN' ? '/admin' : role === 'FLAT_POSTER' ? '/my-listings' : '/listings')
