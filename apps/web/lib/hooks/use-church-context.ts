'use client'

import { useContext, createContext } from 'react'

export interface ChurchContextType {
  churchId: string | null
  church: {
    id: string
    name: string
    location: string
    leadPastorName: string
    phone?: string
    email?: string
  } | null
  setChurch: (church: ChurchContextType['church']) => void
  isLoading: boolean
}

export const ChurchContext = createContext<ChurchContextType | undefined>(undefined)

export function useChurchContext() {
  const context = useContext(ChurchContext)
  if (!context) {
    throw new Error('useChurchContext must be used within ChurchProvider')
  }
  return context
}

export function useOptionalChurchContext() {
  const context = useContext(ChurchContext)
  return context
}
