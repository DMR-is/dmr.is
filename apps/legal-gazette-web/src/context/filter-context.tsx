import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsIsoDate,
  parseAsString,
  parseAsStringEnum,
  useQueryStates,
} from 'nuqs'
import { createContext, useState } from 'react'

import { useSuspenseQuery } from '@dmr.is/trpc/client/trpc'

import { Tag } from '@island.is/island-ui/core'

import { BaseEntityDto } from '../gen/fetch'
import { QueryParams } from '../lib/constants'
import {  useTRPC } from '../lib/trpc/client/trpc'


type Option<T = string> = {
  label: string
  value: T
}

interface Params {
  [QueryParams.SEARCH]: string
  [QueryParams.PAGE]: number
  [QueryParams.PAGE_SIZE]: number
  [QueryParams.CATEGORY]: string[]
  [QueryParams.STATUS]: string[]
  [QueryParams.TYPE]: string[]
  [QueryParams.DATE_FROM]?: Date | null
  [QueryParams.DATE_TO]?: Date | null
  [QueryParams.SORT_BY]?: string | null
  [QueryParams.DIRECTION]: 'asc' | 'desc'
}

type ActiveFilters = {
  label: string
  onClick: () => void
  variant?: React.ComponentProps<typeof Tag>['variant']
}

export type FilterContextState = {
  typeOptions: Option[]
  categoryOptions: Option[]
  statusOptions: Option[]
  setTypeOptions: (options: Option[]) => void
  setCategoryOptions: (options: Option[]) => void
  setStatusOptions: (options: Option[]) => void
  resetTypeOptions: () => void
  resetCategoryOptions: () => void
  resetStatusOptions: () => void
  params: Params
  setParams: (params: Partial<Params>) => Promise<URLSearchParams>
  activeFilters: ActiveFilters[]
  resetParams: () => void
}

export const FilterContext = createContext<FilterContextState>({
  typeOptions: [],
  categoryOptions: [],
  statusOptions: [],
  setTypeOptions: () => undefined,
  setCategoryOptions: () => undefined,
  setStatusOptions: () => undefined,
  resetTypeOptions: () => undefined,
  resetCategoryOptions: () => undefined,
  resetStatusOptions: () => undefined,
  params: {} as Params,
  setParams: async () => new URLSearchParams(),
  activeFilters: [],
  resetParams: () => undefined,
})

type FilterProviderProps = {
  children?: React.ReactNode
}

export const FilterProvider = ({ children }: FilterProviderProps) => {
  const trpc = useTRPC()
  const { data: entities } = useSuspenseQuery(
    trpc.getAllEntities.queryOptions(),
  )

  const categories = {
    categories: entities?.categories || [],
  }
  const types = {
    types: entities?.types || [],
  }
  const statuses = {
    statuses: entities?.statuses || [],
  }

  const [searchParams, setSearchParams] = useQueryStates(
    {
      [QueryParams.SEARCH]: parseAsString.withDefault(''),
      [QueryParams.PAGE]: parseAsInteger.withDefault(1),
      [QueryParams.PAGE_SIZE]: parseAsInteger.withDefault(10),
      [QueryParams.CATEGORY]: parseAsArrayOf(parseAsString).withDefault([]),
      [QueryParams.TYPE]: parseAsArrayOf(parseAsString).withDefault([]),
      [QueryParams.STATUS]: parseAsArrayOf(parseAsString).withDefault([]),
      [QueryParams.DATE_FROM]: parseAsIsoDate,
      [QueryParams.DATE_TO]: parseAsIsoDate,
      [QueryParams.SORT_BY]: parseAsString,
      [QueryParams.DIRECTION]: parseAsStringEnum(['asc', 'desc']).withDefault(
        'desc',
      ),
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
      [QueryParams.SEARCH]: '',
      [QueryParams.PAGE]: 1,
      [QueryParams.PAGE_SIZE]: 10,
      [QueryParams.CATEGORY]: [],
      [QueryParams.STATUS]: [],
      [QueryParams.TYPE]: [],
      [QueryParams.DATE_FROM]: null,
      [QueryParams.DATE_TO]: null,
      [QueryParams.SORT_BY]: null,
      [QueryParams.DIRECTION]: 'asc',
    })
  }

  const activeFilters = Object.entries(searchParams).reduce(
    (acc, [key, value]) => {
      if (key === QueryParams.CATEGORY && Array.isArray(value)) {
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

      if (key === QueryParams.TYPE && Array.isArray(value)) {
        const typeNames = types.types
          .filter((type) => value.includes(type.id))
          .map((type) => type.title)
        typeNames.forEach((title) => {
          acc.push({
            label: title,
            variant: 'blueberry',
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

      if (key === QueryParams.STATUS && Array.isArray(value)) {
        const statusNames = statuses.statuses
          .filter((status) => value.includes(status.id))
          .map((status) => status.title)
        statusNames.forEach((title) => {
          acc.push({
            label: title,
            variant: 'mint',
            onClick: () => {
              const newStatus = (searchParams.statusId as string[]).filter(
                (id) => {
                  const status = statuses.statuses.find((s) => s.id === id)
                  return status?.title !== title
                },
              )
              setSearchParams({
                ...searchParams,
                statusId: newStatus,
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

  const [typeOptions, setInternalTypeOptions] = useState(
    types.types.map((type) => ({
      label: type.title,
      value: type.id,
    })),
  )

  const [categoryOptions, setInternalCategoryOptions] = useState(
    categories.categories.map((category) => ({
      label: category.title,
      value: category.id,
    })),
  )

  const [statusOptions, setInternalStatusOptions] = useState(
    statuses.statuses.map((status) => ({
      label: status.title,
      value: status.id,
    })),
  )

  const resetOptions = <T extends BaseEntityDto>(
    source: T[],
    setter: (options: Option[]) => void,
  ) => {
    setter(
      source.map((item) => ({
        label: item.title,
        value: item.id,
      })),
    )
  }

  const resetStatusOptions = () => {
    resetOptions(statuses.statuses, setInternalStatusOptions)
  }

  const resetCategoryOptions = () => {
    resetOptions(categories.categories, setInternalCategoryOptions)
  }

  const resetTypeOptions = () => {
    resetOptions(types.types, setInternalTypeOptions)
  }

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
        statusOptions,
        categoryOptions,
        typeOptions,
        setStatusOptions: setInternalStatusOptions,
        setCategoryOptions: setInternalCategoryOptions,
        setTypeOptions: setInternalTypeOptions,
        resetCategoryOptions,
        resetTypeOptions,
        resetStatusOptions,
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
