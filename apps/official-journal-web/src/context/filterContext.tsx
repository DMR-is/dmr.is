import { createContext, useState } from 'react'

type FilterContextProps = {
  enableTypes: boolean
  enableDepartments: boolean
  enableCategories: boolean
  setEnableTypes: (enableTypes: boolean) => void
  setEnableDepartments: (enableDepartments: boolean) => void
  setEnableCategories: (enableCategories: boolean) => void
}

export const FilterContext = createContext<FilterContextProps>({
  enableTypes: false,
  enableDepartments: false,
  enableCategories: false,
  setEnableTypes: () => {},
  setEnableDepartments: () => {},
  setEnableCategories: () => {},
})

export const FilterContextProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const setEnableTypes = (enableTypes: boolean) => {
    setState((prevState) => ({ ...prevState, enableTypes }))
  }

  const setEnableDepartments = (enableDepartments: boolean) => {
    setState((prevState) => ({ ...prevState, enableDepartments }))
  }

  const setEnableCategories = (enableCategories: boolean) => {
    setState((prevState) => ({ ...prevState, enableCategories }))
  }

  const initalState: FilterContextProps = {
    enableTypes: false,
    enableDepartments: false,
    enableCategories: false,
    setEnableTypes,
    setEnableDepartments,
    setEnableCategories,
  }

  const [state, setState] = useState(initalState)

  return (
    <FilterContext.Provider value={state}>{children}</FilterContext.Provider>
  )
}
