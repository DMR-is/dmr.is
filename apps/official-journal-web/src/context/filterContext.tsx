import { createContext, useCallback, useState } from 'react'

type FilterStateProps = {
  enableTypes: boolean
  enableDepartments: boolean
  enableCategories: boolean
  activeFilters: Array<{
    key: string
    slug: string
    label: string
  }>
}

const filterStateDefaults: FilterStateProps = {
  enableTypes: false,
  enableDepartments: false,
  enableCategories: false,
  activeFilters: [],
}

type FilterStateContext = {
  filterState: FilterStateProps
  setEnableTypes: (enableTypes: boolean) => void
  setEnableDepartments: (enableDepartments: boolean) => void
  setEnableCategories: (enableCategories: boolean) => void
  toggleFilter: (
    toggle: boolean,
    key: string,
    slug: string,
    label: string,
  ) => void
  clearFilter: (key?: string, slug?: string) => void
}

export const FilterContext = createContext<FilterStateContext>({
  filterState: {
    enableTypes: false,
    enableDepartments: false,
    enableCategories: false,
    activeFilters: [],
  },
  setEnableTypes: () => {},
  setEnableDepartments: () => {},
  setEnableCategories: () => {},
  toggleFilter: () => {},
  clearFilter: () => {},
})

export const FilterContextProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [state, updateState] = useState<FilterStateProps>(filterStateDefaults)

  const setEnableTypes = (enableTypes: boolean) => {
    updateState((prevState) => ({ ...prevState, enableTypes }))
  }

  const setEnableDepartments = (enableDepartments: boolean) => {
    updateState((prevState) => ({ ...prevState, enableDepartments }))
  }

  const setEnableCategories = (enableCategories: boolean) => {
    updateState((prevState) => ({ ...prevState, enableCategories }))
  }

  const toggleFilter = useCallback(
    (toggle: boolean, key: string, slug: string, label: string) => {
      console.log({ toggle, key, slug })

      if (toggle) {
        const newFilters = [...state.activeFilters]
        newFilters.push({ key, slug, label })
        console.log({ newFilters })

        updateState((prevState) => ({
          ...prevState,
          activeFilters: newFilters,
        }))
      } else {
        const newFilters = [...state.activeFilters].filter(
          (f) => !(f.key === key && f.slug === slug),
        )
        updateState((prevState) => ({
          ...prevState,
          activeFilters: newFilters,
        }))
      }
    },
    [state.activeFilters],
  )

  const clearFilter = useCallback(
    (key?: string, slug?: string) => {
      if (key && slug) {
        const newFilters = [...state.activeFilters].filter(
          (f) => !(f.key === key && f.slug === slug),
        )
        updateState((prevState) => ({
          ...prevState,
          activeFilters: newFilters,
        }))
      } else if (key) {
        const newFilters = [...state.activeFilters].filter((f) => f.key !== key)
        updateState((prevState) => ({
          ...prevState,
          activeFilters: newFilters,
        }))
      } else {
        updateState((prevState) => ({ ...prevState, activeFilters: [] }))
      }
    },
    [state.activeFilters],
  )

  return (
    <FilterContext.Provider
      value={{
        filterState: state,
        setEnableTypes,
        setEnableDepartments,
        setEnableCategories,
        toggleFilter,
        clearFilter,
      }}
    >
      {children}
    </FilterContext.Provider>
  )
}
