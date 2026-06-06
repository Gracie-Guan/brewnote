import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { setupNewUser } from '../lib/setupNewUser'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const setupRanFor = useRef(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Run outside the auth state machine callback so the session is fully
  // committed before making database requests.
  // Guard against running twice when both getSession and onAuthStateChange
  // resolve for the same user.
  useEffect(() => {
    if (user && setupRanFor.current !== user.id) {
      setupRanFor.current = user.id
      setupNewUser(user).catch(console.error)
    }
  }, [user])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
