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

export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc',
}

export const DEFAULT_SORT_DIRECTION = SortDirection.ASC

export const FILTERS_TO_SHOW = [
  QueryParams.PUBLICATION,
  QueryParams.TYPE,
  QueryParams.CATEGORY,
]

export enum Route {
  STJORNBORD = '/',
  RITSTJORN = '/ritstjorn',
  RITSTJORN_ID = '/ritstjorn/[id]',
  UTGAFA = '/utgafa',
  HEILDARYFIRLIT = '/heildaryfirlit',
  LOGIN = '/innskraning',
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
            pathName: 'Stakt mál',
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

export enum RitstjornTabs {
  SUBMITTED = 'innsendar',
  PUBLISHING = 'a-leid-i-utgafu',
  COMPLETED = 'klaradar',
}
