import uniqBy from 'lodash/uniqBy'
import { createContext, useEffect, useState } from 'react'

export type FilterOption = {
  label: string
  value: string
}

type FilterContextProps = {
  searchFilter: string
  allActiveFilters: FilterOption[]
  publishingFilterOptions: FilterOption[]
  typeFilterOptions: FilterOption[]
  departmentFilterOptions: FilterOption[]
  categoriesFilterOptions: FilterOption[]
  setSearchFilter: (search: string) => void
  setPublishingFilterOptions: (options: FilterOption[]) => void
  setTypeFilterOptions: (options: FilterOption[]) => void
  setDepartmentFilterOptions: (options: FilterOption[]) => void
  setCategoriesFilterOptions: (options: FilterOption[]) => void
}

export const FilterContext = createContext<FilterContextProps>({
  searchFilter: '',
  allActiveFilters: [],
  publishingFilterOptions: [],
  typeFilterOptions: [],
  departmentFilterOptions: [],
  categoriesFilterOptions: [],
  setSearchFilter: () => null,
  setPublishingFilterOptions: () => null,
  setTypeFilterOptions: () => null,
  setDepartmentFilterOptions: () => null,
  setCategoriesFilterOptions: () => null,
})

export const FilterContextProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const getAllActiveFilters = (
    current: FilterOption[],
    incoming: FilterOption[],
  ) => {
    return uniqBy([...current, ...incoming], 'value')
  }

  const setSearchFilter = (search: string) => {
    setState((prev) => ({
      ...prev,
      searchFilter: search,
    }))
  }

  const setPublishingFilterOptions = (options: FilterOption[]) => {
    setState((prev) => ({
      ...prev,
      publishingFilterOptions: options,
      allActiveFilters: getAllActiveFilters(prev.allActiveFilters, options),
    }))
  }

  const setTypeFilterOptions = (options: FilterOption[]) => {
    setState((prev) => ({
      ...prev,
      typeFilterOptions: options,
      allActiveFilters: getAllActiveFilters(prev.allActiveFilters, options),
    }))
  }

  const setDepartmentFilterOptions = (options: FilterOption[]) => {
    setState((prev) => ({
      ...prev,
      departmentFilterOptions: options,
      allActiveFilters: getAllActiveFilters(prev.allActiveFilters, options),
    }))
  }

  const setCategoriesFilterOptions = (options: FilterOption[]) => {
    setState((prev) => ({
      ...prev,
      categoriesFilterOptions: options,
      allActiveFilters: getAllActiveFilters(prev.allActiveFilters, options),
    }))
  }

  const initalState: FilterContextProps = {
    searchFilter: '',
    allActiveFilters: [],
    publishingFilterOptions: [],
    typeFilterOptions: [],
    departmentFilterOptions: [],
    categoriesFilterOptions: [],
    setSearchFilter,
    setPublishingFilterOptions,
    setTypeFilterOptions,
    setDepartmentFilterOptions,
    setCategoriesFilterOptions,
  }

  const [state, setState] = useState(initalState)

  return (
    <FilterContext.Provider value={state}>{children}</FilterContext.Provider>
  )
}
