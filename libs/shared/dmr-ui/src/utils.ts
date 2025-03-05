import { ControlPanelRoute } from './lib/ControlPanel/ControlPanel'

export const flattenPaths = (
  paths: ControlPanelRoute[],
): ControlPanelRoute[] => {
  const result: ControlPanelRoute[] = []

  const flatten = (routes: ControlPanelRoute[]) => {
    routes.forEach((route) => {
      if (route.children && route.children.length > 0) {
        result.push(route)
        flatten(route.children)
      } else {
        if (route.showInNavigation) {
          result.push(route)
        }
      }
    })
  }

  flatten(paths)
  return result
}

export const findPath = (
  paths: ControlPanelRoute[],
  pathToFind: string,
): string | null => {
  let foundPath = null

  const search = (pathsToSearch: ControlPanelRoute[]) => {
    pathsToSearch.forEach((path) => {
      if (path.path === pathToFind) {
        foundPath = path.pathName
      }
      if (path.children && path.children.length > 0) {
        search(path.children)
      }
    })
  }

  search(paths)
  return foundPath
}
