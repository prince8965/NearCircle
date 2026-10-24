import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { User } from '../types'
import { authAdapter, isSupabaseConfigured, supabase } from '../services'
import { removeStore, writeStore } from '../utils/storage'

interface AuthValue {
  user: User | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (name: string, email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => authAdapter.getSession())

  useEffect(() => {
    if (!isSupabaseConfigured()) return

    // Sync active session if available from Supabase client
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const u: User = {
          id: session.user.id,
          name:
            (session.user.user_metadata?.name as string) ||
            session.user.email?.split('@')[0] ||
            'User',
          email: session.user.email || '',
        }
        setUser(u)
        writeStore('session', u)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const u: User = {
          id: session.user.id,
          name:
            (session.user.user_metadata?.name as string) ||
            session.user.email?.split('@')[0] ||
            'User',
          email: session.user.email || '',
        }
        setUser(u)
        writeStore('session', u)
      } else {
        setUser(null)
        removeStore('session')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    setUser(await authAdapter.signIn(email, password))
  }, [])

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    setUser(await authAdapter.signUp(name, email, password))
  }, [])

  const signOut = useCallback(async () => {
    await authAdapter.signOut()
    setUser(null)
  }, [])

  const value = useMemo(() => ({ user, signIn, signUp, signOut }), [user, signIn, signUp, signOut])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
