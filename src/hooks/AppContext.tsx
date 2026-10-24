import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { DEFAULT_LOCALITY_ID } from '../data/localities'
import { defaultFilters } from '../services'
import type { Category } from '../types'
import { readStore, writeStore } from '../utils/storage'

interface AppValue {
  localityId: string
  setLocalityId: (id: string) => void
  interests: Category[]
  toggleInterest: (c: Category) => void
}

const AppContext = createContext<AppValue | null>(null)

/**
 * Holds the user's chosen locality and interests.
 * Only a locality NAME/ID is stored — never precise coordinates — and location permission is never requested automatically.
 */
export function AppProvider({ children }: { children: ReactNode }) {
  const [localityId, setLocalityState] = useState<string>(() => readStore('locality', DEFAULT_LOCALITY_ID))
  const [interests, setInterests] = useState<Category[]>(() => readStore('interests', defaultFilters.interests))

  const setLocalityId = useCallback((id: string) => {
    setLocalityState(id)
    writeStore('locality', id)
  }, [])

  const toggleInterest = useCallback((c: Category) => {
    setInterests((prev) => {
      const next = prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
      writeStore('interests', next)
      return next
    })
  }, [])

  const value = useMemo(
    () => ({ localityId, setLocalityId, interests, toggleInterest }),
    [localityId, setLocalityId, interests, toggleInterest],
  )
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>')
  return ctx
}
