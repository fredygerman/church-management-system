"use client"

import React, { createContext, useContext, useState } from "react"

interface ZonesTableContextProps {
  someState: string
  setSomeState: React.Dispatch<React.SetStateAction<string>>
}

const ZonesTableContext = createContext<ZonesTableContextProps | undefined>(
  undefined
)

export const ZonesTableProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [someState, setSomeState] = useState("")

  return (
    <ZonesTableContext.Provider value={{ someState, setSomeState }}>
      {children}
    </ZonesTableContext.Provider>
  )
}

export const useZonesTable = () => {
  const context = useContext(ZonesTableContext)
  if (!context) {
    throw new Error(
      "useZonesTable must be used within a ZonesTableProvider"
    )
  }
  return context
}
