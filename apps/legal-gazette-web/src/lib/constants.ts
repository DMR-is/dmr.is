import { RouteItem } from './types'

export const DEFAULT_PAGE = 1
export const DEFAULT_PAGE_SIZE = 10

export enum QueryParams {
  SEARCH = 'search',
  STATUS = 'status',
  TYPE = 'type',
  CATEGORY = 'category',
  PUBLICATION = 'publication',
  PAGE = 'page',
  PAGE_SIZE = 'pageSize',
  SORT_BY = 'sortBy',
  DIRECTION = 'direction',
}

export enum Route {
  STJORNBORD = '/',
  RITSTJORN = '/ritstjorn',
  RITSTJORN_ID = '/ritstjorn/[id]',
  UTGAFA = '/utgafa',
  HEILDARYFIRLIT = '/heildaryfirlit',
}

export const Routes: RouteItem[] = [
  {
    path: Route.STJORNBORD,
    pathName: 'Stjórnborð',
    showInNavigation: true,
    children: [
      {
        path: Route.RITSTJORN,
        pathName: 'Ritstjórn',
        showInNavigation: true,
        children: [
          {
            path: Route.RITSTJORN_ID,
            pathName: 'Ritstjórn',
            showInNavigation: false,
          },
        ],
      },
      {
        path: Route.UTGAFA,
        pathName: 'Útgáfa',
        showInNavigation: true,
        children: [],
      },
      {
        path: Route.HEILDARYFIRLIT,
        pathName: 'Heildaryfirlit',
        showInNavigation: true,
        children: [],
      },
    ],
  },
]
