import { QueryParams, Route } from './constants'

export type QueryFilters = {
  [QueryParams.SEARCH]: string // default ''
  [QueryParams.STATUS]: string[] // default []
  [QueryParams.TYPE]: string[] // default []
  [QueryParams.CATEGORY]: string[] // default []
  [QueryParams.PUBLICATION]: string[] // default []
  [QueryParams.PAGE]: number // default 1
  [QueryParams.PAGE_SIZE]: number // default 10
  [QueryParams.SORT_BY]: string | null // maybe we can set default here to avoid null
  [QueryParams.DIRECTION]: string // default 'desc'
}

export type QueryFilterParam = QueryFilters[keyof QueryFilters]

export type QueryFilterValue = Exclude<QueryFilterParam, Array<unknown>>

export type RouteItem = {
  path: Route
  pathName: string
  showInNavigation?: boolean
  isCurrentPage?: boolean
  children?: RouteItem[]
}

export type OptionType<T> = {
  label: string
  value: T
}
