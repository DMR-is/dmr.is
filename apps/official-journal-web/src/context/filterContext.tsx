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
  renderFilters?: boolean
  setRenderFilters?: (render: boolean) => void
}

export const FilterContext = createContext<FilterContextProps>({
  searchFilter: '',
  renderFilters: true,
  setSearchFilter: () => {},
  setRenderFilters: () => {},
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

  const setRenderFilters = (render: boolean) => {
    setState((prev) => ({
      ...prev,
      renderFilters: render,
    }))
  }

  const initalState: FilterContextProps = {
    filterGroups: filterGroups,
    searchFilter: '',
    renderFilters: true,
    setSearchFilter,
    setRenderFilters,
  }

  const [state, setState] = useState(initalState)

  return (
    <FilterContext.Provider value={state}>{children}</FilterContext.Provider>
  )
}
