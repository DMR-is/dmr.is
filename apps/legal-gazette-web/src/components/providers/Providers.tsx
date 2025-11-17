'use client'

import { FilterProvider } from '../../context/filter-context'

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return <FilterProvider>{children}</FilterProvider>
}
