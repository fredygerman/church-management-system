"use client"

import React, { createContext, useContext } from "react"

interface VisitorTableContextType {
  churchId: string
}

const VisitorTableContext = createContext<VisitorTableContextType | undefined>(undefined)

export function VisitorTableProvider({
  children,
  churchId,
}: {
  children: React.ReactNode
  churchId: string
}) {
  return (
    <VisitorTableContext.Provider value={{ churchId }}>
      {children}
    </VisitorTableContext.Provider>
  )
}

export function useVisitorTableContext() {
  const context = useContext(VisitorTableContext)
  if (!context) {
    throw new Error("useVisitorTableContext must be used within VisitorTableProvider")
  }
  return context
}
