import { useContext } from 'react'

import { FilterContext } from '../context/filter-context'

export const useFilterContext = () => {
  const filterContext = useContext(FilterContext)

  if (!filterContext) {
    throw new Error('useFilters must be used within a FilterProvider')
  }

  return filterContext
}
