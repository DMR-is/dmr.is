import { RitstjornTabs, Route } from './constants'
import { QueryFilterParam, QueryFilterValue, RouteItem } from './types'

export const routesToBreadcrumbs = (
  routes: RouteItem[],
  currentPath: Route,
  pathNameReplace?: string,
) => {
  const breadcrumbs: RouteItem[] = []

  const findRoute = (routes: RouteItem[], path: RouteItem[] = []) => {
    for (const route of routes) {
      const newPath = [...path, route] // Keep track of breadcrumb trail

      if (route.path === currentPath) {
        // check if there are replacements for the current route
        if (pathNameReplace) {
          newPath[newPath.length - 1].pathName = pathNameReplace
        }

        route.isCurrentPage = true // Mark the current route

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
    isCurrentPage: r.isCurrentPage || false,
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

export const mapQueryToRitstjornTabs = (
  query: string | string[] | undefined,
): RitstjornTabs => {
  const values = Object.values(RitstjornTabs)

  const found = values.find((tab) => {
    if (Array.isArray(query)) {
      return query.includes(tab)
    }
    return query === tab
  })
  return found ?? RitstjornTabs.SUBMITTED
}

export const flattenMessages = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messages: Record<string, any>,
): Record<string, string> => {
  return Object.entries(messages).reduce(
    (acc, [_key, value]) => {
      if (value.id && value.defaultMessage) {
        // Leaf message
        acc[value.id] = value.defaultMessage
      } else if (typeof value === 'object') {
        // Recurse
        Object.assign(acc, flattenMessages(value))
      }

      return acc
    },
    {} as Record<string, string>,
  )
}

export const getLoginRedirectUrl = (callbackUrl?: string) => {
  const isRelativeUrl = callbackUrl && callbackUrl.startsWith('/')

  if (callbackUrl && isRelativeUrl && callbackUrl !== '/') {
    return `${Route.LOGIN}?callbackUrl=${callbackUrl}`
  }

  return Route.LOGIN
}

export const loginRedirect = (callbackUrl?: string) => {
  const fullUrl = getLoginRedirectUrl(callbackUrl)

  return {
    redirect: {
      destination: fullUrl,
      permanent: false,
    },
  }
}
