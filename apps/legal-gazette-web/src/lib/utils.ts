import format from 'date-fns/format'

import { Route } from './constants'
import { QueryFilterParam, QueryFilterValue, RouteItem } from './types'

export const routesToBreadcrumbs = (
  routes: RouteItem[],
  currentPath: Route,
) => {
  const breadcrumbs: RouteItem[] = []

  const findRoute = (routes: RouteItem[], path: RouteItem[] = []) => {
    for (const route of routes) {
      const newPath = [...path, route] // Keep track of breadcrumb trail

      if (route.path === currentPath) {
        breadcrumbs.push(...newPath) // Push all breadcrumb items into the array
        return // Stop searching when a match is found
      }

      if (route.children) {
        findRoute(route.children, newPath)
        if (breadcrumbs.length) return // Stop recursion if breadcrumbs are filled
      }
    }
  }

  findRoute(routes)
  return breadcrumbs.map((r) => ({
    href: r.path,
    title: r.pathName,
  }))
}

export const isArrayOptionSelected = (
  filter: QueryFilterParam,
  value: QueryFilterValue,
): boolean => {
  if (filter === null) return false
  if (value === null) return false

  if (Array.isArray(filter) && typeof value === 'string') {
    return filter.includes(value)
  }

  return filter === value
}

export const toggleArrayOption = (
  filter: QueryFilterParam,
  opt: QueryFilterValue,
  checked: boolean,
) => {
  if (!Array.isArray(filter)) {
    return checked ? [opt] : []
  }

  if (checked) {
    return [...filter, opt]
  }

  return filter.filter((f) => f !== opt)
}

const dateFormats = ['dd.MM.yyyy'] as const

export const formatDate = (
  date: Date | string,
  dateFormat: (typeof dateFormats)[number] = 'dd.MM.yyyy',
) => {
  if (typeof date === 'string') {
    date = new Date(date)
  }

  if (date instanceof Date && !isNaN(date.getTime())) {
    return format(date, dateFormat)
  }

  throw new Error(`Invalid date: ${date}`)
}
