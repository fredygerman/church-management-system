'use client'

import React from 'react'
import { createContext, useContext } from 'react'

const DepartmentsTableContext = createContext(undefined)

export function DepartmentsTableProvider({ children }: { children: React.ReactNode }) {
  return (
    <DepartmentsTableContext.Provider value={undefined}>
      {children}
    </DepartmentsTableContext.Provider>
  )
}

export function useDepartmentsTable() {
  const context = useContext(DepartmentsTableContext)
  if (context === undefined) {
    throw new Error('useDepartmentsTable must be used within DepartmentsTableProvider')
  }
  return context
}
