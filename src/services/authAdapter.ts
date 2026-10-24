import type { User } from '../types'
import { readStore, removeStore, writeStore } from '../utils/storage'
import { delay, notifyChange } from './bus'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

export interface AuthAdapter {
  getSession(): User | null
  signIn(email: string, password: string): Promise<User>
  signUp(name: string, email: string, password: string): Promise<User>
  signOut(): Promise<void>
}

const SESSION_KEY = 'session'

/** All demo organizer data belongs to this single identity (see README). */
export const DEMO_OWNER_ID = 'u-demo'

export const demoAuthAdapter: AuthAdapter = {
  getSession() {
    return readStore<User | null>(SESSION_KEY, null)
  },
  async signIn(email, password) {
    await delay(600)
    if (!email || password.length < 8) throw new Error('Enter a valid email and a password of at least 8 characters.')
    const name = email.split('@')[0].replace(/[._-]+/g, ' ')
    const user: User = { id: DEMO_OWNER_ID, name: titleCase(name), email }
    writeStore(SESSION_KEY, user)
    notifyChange()
    return user
  },
  async signUp(name, email, password) {
    await delay(600)
    if (!name || !email || password.length < 8) throw new Error('Please complete all fields correctly.')
    const user: User = { id: DEMO_OWNER_ID, name: name.trim(), email }
    writeStore(SESSION_KEY, user)
    notifyChange()
    return user
  },
  async signOut() {
    await delay(200)
    removeStore(SESSION_KEY)
    notifyChange()
  },
}

export const supabaseAuthAdapter: AuthAdapter = {
  getSession() {
    return readStore<User | null>(SESSION_KEY, null)
  },
  async signIn(email, password) {
    // Buffer for smooth UX feedback
    await delay(600)
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    if (error) {
      throw new Error(error.message)
    }
    if (!data.user) {
      throw new Error('Login failed. Please check your credentials.')
    }
    const user: User = {
      id: data.user.id,
      name:
        (data.user.user_metadata?.name as string) ||
        titleCase(email.split('@')[0].replace(/[._-]+/g, ' ')),
      email: data.user.email || email.trim(),
    }
    writeStore(SESSION_KEY, user)
    notifyChange()
    return user
  },
  async signUp(name, email, password) {
    // Buffer for smooth UX feedback
    await delay(600)
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          name: name.trim(),
        },
      },
    })
    if (error) {
      throw new Error(error.message)
    }
    if (!data.user) {
      throw new Error('Registration failed. Please try again.')
    }
    const user: User = {
      id: data.user.id,
      name: (data.user.user_metadata?.name as string) || name.trim(),
      email: data.user.email || email.trim(),
    }
    writeStore(SESSION_KEY, user)
    notifyChange()
    return user
  },
  async signOut() {
    await delay(200)
    try {
      await supabase.auth.signOut()
    } catch {
      // Ignore network errors on signout
    }
    removeStore(SESSION_KEY)
    notifyChange()
  },
}

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Uses real Supabase Auth when credentials are configured in .env, else falls back to demo mode. */
export const authAdapter: AuthAdapter = isSupabaseConfigured() ? supabaseAuthAdapter : demoAuthAdapter
