import { Route } from './constants'
import { RouteItem } from './types'

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

export const isOptionSelected = <T>(
  arr: string[] | string | number | null,
  opt: T | null,
): boolean => {
  if (arr === null || opt === null) {
    return false
  }

  return arr.includes(opt)
}

export const toggleArrayOption = <T>(
  arr: T[] | null,
  opt: T | null,
  checked: boolean,
) => {
  if (arr === null) {
    return [opt]
  }

  if (checked === false) {
    return arr.filter((o) => o !== opt)
  }

  if (checked === true) {
    return [...arr, opt]
  }
}
