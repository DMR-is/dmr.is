// apps/legal-gazette-public-web/src/components/client-components/search-page/hooks/useTotalItems.ts
'use client'

import { createContext, useContext, useState } from 'react'

type TotalItemsContextValue = {
  totalItems: number | undefined
  setTotalItems: (value: number | undefined) => void
}

const TotalItemsContext = createContext<TotalItemsContextValue | undefined>(
  undefined,
)

export const TotalItemsProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [totalItems, setTotalItems] = useState<number | undefined>(undefined)

  return (
    <TotalItemsContext.Provider value={{ totalItems, setTotalItems }}>
      {children}
    </TotalItemsContext.Provider>
  )
}

export const useTotalItemsContext = () => {
  const ctx = useContext(TotalItemsContext)
  if (!ctx) {
    throw new Error(
      'useTotalItemContext must be used within TotalItemsProvider',
    )
  }
  return ctx
}
