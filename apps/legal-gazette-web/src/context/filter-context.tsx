import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsIsoDate,
  parseAsString,
  parseAsStringEnum,
  useQueryStates,
} from 'nuqs'
import { createContext } from 'react'

import { GetCategoriesDto, GetTypesDto } from '../gen/fetch'
type Option<T = string> = {
  label: string
  value: T
}

type Params = {
  search: string
  page: number
  pageSize: number
  categoryId: string[]
  typeId: string[]
  dateFrom?: Date
  dateTo?: Date
  sortBy?: string
  direction: 'asc' | 'desc'
}

type ActiveFilters = {
  label: string
  onClick: () => void
}

export type FilterContextState = {
  typeOptions: Option[]
  categoryOptions: Option[]
  params: Params
  setParams: (params: Partial<Params>) => Promise<URLSearchParams>
  activeFilters: ActiveFilters[]
  resetParams?: () => void
}

export const FilterContext = createContext<FilterContextState>({
  typeOptions: [],
  categoryOptions: [],
  params: {} as Params,
  setParams: async () => new URLSearchParams(),
  activeFilters: [],
  resetParams: () => undefined,
})

type FilterProviderProps = {
  types: GetTypesDto
  categories: GetCategoriesDto
  children: React.ReactNode
}

export const FilterProvider = ({
  children,
  types,
  categories,
}: FilterProviderProps) => {
  const [searchParams, setSearchParams] = useQueryStates(
    {
      search: parseAsString.withDefault(''),
      page: parseAsInteger.withDefault(1),
      pageSize: parseAsInteger.withDefault(10),
      categoryId: parseAsArrayOf(parseAsString).withDefault([]),
      typeId: parseAsArrayOf(parseAsString).withDefault([]),
      dateFrom: parseAsIsoDate,
      dateTo: parseAsIsoDate,
      sortBy: parseAsString,
      direction: parseAsStringEnum(['asc', 'desc']).withDefault('desc'),
    },
    {
      clearOnDefault: true,
      urlKeys: {
        categoryId: 'category',
        typeId: 'type',
      },
    },
  )

  const resetSearchParams = () => {
    setSearchParams({
      search: '',
      page: 1,
      pageSize: 10,
      categoryId: [],
      typeId: [],
      dateFrom: null,
      dateTo: null,
      sortBy: null,
      direction: 'desc',
    })
  }

  const activeFilters = Object.entries(searchParams).reduce(
    (acc, [key, value]) => {
      if (key === 'categoryId' && Array.isArray(value)) {
        const categoryNames = categories.categories
          .filter((category) => value.includes(category.id))
          .map((category) => category.title)

        categoryNames.forEach((title) => {
          acc.push({
            label: title,
            onClick: () => {
              const newCategories = (
                searchParams.categoryId as string[]
              ).filter((id) => {
                const category = categories.categories.find(
                  (cat) => cat.id === id,
                )
                return category?.title !== title
              })
              setSearchParams({
                ...searchParams,
                categoryId: newCategories,
                page: 1,
              })
            },
          })
        })
        return acc
      }

      if (key === 'typeId' && Array.isArray(value)) {
        const typeNames = types.types
          .filter((type) => value.includes(type.id))
          .map((type) => type.title)
        typeNames.forEach((title) => {
          acc.push({
            label: title,
            onClick: () => {
              const newTypes = (searchParams.typeId as string[]).filter(
                (id) => {
                  const type = types.types.find((t) => t.id === id)
                  return type?.title !== title
                },
              )
              setSearchParams({
                ...searchParams,
                typeId: newTypes,
                page: 1,
              })
            },
          })
        })
        return acc
      }

      return acc
    },
    [] as ActiveFilters[],
  )

  const typeOptions = types.types.map((type) => ({
    label: type.title,
    value: type.id,
  }))

  const categoryOptions = categories.categories.map((category) => ({
    label: category.title,
    value: category.id,
  }))

  const setParams = (params: Partial<Params>) => {
    const updatedParams = {
      ...searchParams,
      ...params,
      page: params.page ?? 1,
    }
    return setSearchParams(updatedParams)
  }

  return (
    <FilterContext.Provider
      value={{
        typeOptions,
        categoryOptions,
        params: searchParams as FilterContextState['params'],
        setParams: setParams,
        activeFilters: activeFilters,
        resetParams: resetSearchParams,
      }}
    >
      {children}
    </FilterContext.Provider>
  )
}
