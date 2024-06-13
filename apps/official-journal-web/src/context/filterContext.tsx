import { createContext, useState } from 'react'

export type FilterOption = {
  label: string
  value: string
}

export type FilterGroup = {
  label: string
  queryKey: string
  options: FilterOption[]
}

type FilterContextProps = {
  filterGroups: FilterGroup[]
  renderFilters: boolean
  setRenderFilters: (render: boolean) => void
  setFilterGroups: (filterGroups: FilterGroup[]) => void
}

export const FilterContext = createContext<FilterContextProps>({
  filterGroups: [],
  renderFilters: true,
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
    renderFilters: true,
    setRenderFilters,
    setFilterGroups,
  }

  const [state, setState] = useState(initalState)

  return (
    <FilterContext.Provider value={state}>{children}</FilterContext.Provider>
  )
}
