"use client"

import React, { createContext, useContext, useState } from "react"

interface MembersTableContextProps {
  someState: string
  setSomeState: React.Dispatch<React.SetStateAction<string>>
}

const MembersTableContext = createContext<MembersTableContextProps | undefined>(
  undefined
)

export const MembersTableProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [someState, setSomeState] = useState("")

  return (
    <MembersTableContext.Provider value={{ someState, setSomeState }}>
      {children}
    </MembersTableContext.Provider>
  )
}

export const useMembersTable = () => {
  const context = useContext(MembersTableContext)
  if (!context) {
    throw new Error(
      "useMembersTable must be used within a MembersTableProvider"
    )
  }
  return context
}
