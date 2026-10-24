import type { User } from '../types'
import { readStore, removeStore, writeStore } from '../utils/storage'
import { delay, notifyChange } from './bus'

/**
 * Auth adapter interface. The demo implementation below is NOT secure authentication:
 * it stores only a display name and email in localStorage, never a password.
 * To move to Supabase Auth, implement this interface with supabase.auth.* and swap `authAdapter`.
 */
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
    await delay(500)
    if (!email || password.length < 8) throw new Error('Enter a valid email and a password of at least 8 characters.')
    const name = email.split('@')[0].replace(/[._-]+/g, ' ')
    const user: User = { id: DEMO_OWNER_ID, name: titleCase(name), email }
    writeStore(SESSION_KEY, user)
    notifyChange()
    return user
  },
  async signUp(name, email, password) {
    await delay(500)
    if (!name || !email || password.length < 8) throw new Error('Please complete all fields correctly.')
    const user: User = { id: DEMO_OWNER_ID, name: name.trim(), email }
    writeStore(SESSION_KEY, user)
    notifyChange()
    return user
  },
  async signOut() {
    await delay(150)
    removeStore(SESSION_KEY)
    notifyChange()
  },
}

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Swap this export to change the auth provider app-wide. */
export const authAdapter: AuthAdapter = demoAuthAdapter
