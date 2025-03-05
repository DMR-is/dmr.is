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
