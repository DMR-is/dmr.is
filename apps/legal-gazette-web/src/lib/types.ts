import { Route } from './constants'

export type RouteItem = {
  path: Route
  pathName: string
  showInNavigation?: boolean
  children?: RouteItem[]
}

export type OptionType<T> = {
  label: string
  value: T
}
