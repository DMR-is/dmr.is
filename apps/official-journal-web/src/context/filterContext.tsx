import { createContext, useState } from 'react'

export type FilterOption = {
  label: string
  key: string
  value: string
}

export type FilterGroup = {
  label: string
  options: FilterOption[]
}

type FilterContextProps = {
  searchFilter: string
  filterGroups?: FilterGroup[]
  renderFilters: boolean
  setSearchFilter: (search: string) => void
  setRenderFilters: (render: boolean) => void
  setFilterGroups: (filterGroups: FilterGroup[]) => void
}

export const FilterContext = createContext<FilterContextProps>({
  searchFilter: '',
  renderFilters: true,
  setSearchFilter: () => {},
  setRenderFilters: () => {},
  setFilterGroups: () => {},
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

  const setFilterGroups = (filterGroups: FilterGroup[]) => {
    setState((prev) => ({
      ...prev,
      filterGroups: filterGroups,
    }))
  }

  const initalState: FilterContextProps = {
    filterGroups: filterGroups,
    searchFilter: '',
    renderFilters: true,
    setSearchFilter,
    setRenderFilters,
    setFilterGroups,
  }

  const [state, setState] = useState(initalState)

  return (
    <FilterContext.Provider value={state}>{children}</FilterContext.Provider>
  )
}
