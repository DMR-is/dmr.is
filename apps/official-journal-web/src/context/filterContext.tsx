import { createContext, useState } from 'react'

export type FilterOption = {
  label: string
  value: string
}

export type FilterGroup = {
  label: string
  options: FilterOption[]
}

type FilterContextProps = {
  searchFilter: string
  filterGroups?: FilterGroup[]
  setSearchFilter: (search: string) => void
}

export const FilterContext = createContext<FilterContextProps>({
  searchFilter: '',
  setSearchFilter: () => {},
})

export const FilterContextProvider = ({
  filterGroups = [],
  children,
}: {
  children: React.ReactNode
  filterGroups?: FilterGroup[]
}) => {
  const setSearchFilter = (search: string) => {
    setState((prev) => ({
      ...prev,
      searchFilter: search,
    }))
  }

  const initalState: FilterContextProps = {
    filterGroups: filterGroups,
    searchFilter: '',
    setSearchFilter,
  }

  const [state, setState] = useState(initalState)

  return (
    <FilterContext.Provider value={state}>{children}</FilterContext.Provider>
  )
}
