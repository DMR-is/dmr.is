import { createContext } from 'react'

type Option<T = string> = {
  label: string
  value: T
}

export type FilterContextState = {
  typeOptions: Option[]
  categoryOptions: Option[]
}

export const FilterContext = createContext<FilterContextState>({
  typeOptions: [],
  categoryOptions: [],
})

type FilterProviderProps = {
  typeOptions: Option[]
  categoryOptions: Option[]
  children: React.ReactNode
}

export const FilterProvider = ({
  children,
  typeOptions,
  categoryOptions,
}: FilterProviderProps) => {
  return (
    <FilterContext.Provider value={{ typeOptions, categoryOptions }}>
      {children}
    </FilterContext.Provider>
  )
}
