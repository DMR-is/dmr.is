import { AdvertTemplateType } from '../gen/fetch'
import { RouteItem } from './types'

export const DEFAULT_PAGE = 1
export const DEFAULT_PAGE_SIZE = 10

export const StatusIdEnum = {
  SUBMITTED: 'cd3bf301-52a1-493e-8c80-a391c310c840',
  IN_PROGRESS: '7ef679c4-4f66-4892-b6ad-ee05e0be4359',
  READY_FOR_PUBLICATION: 'a2f3b1c4-2d5e-4a7b-8c6f-9d1e0f3a2b8c',
  PUBLISHED: 'bd835a1d-0ecb-4aa4-9910-b5e60c30dced',
  REJECTED: 'f3a0b1c4-2d5e-4a7b-8c6f-9d1e0f3a2b8c',
  WITHDRAWN: 'e2f3b1c4-2d5e-4a7b-8c6f-9d1e0f3a2b8c',
} as const

export type StatusIdEnum = (typeof StatusIdEnum)[keyof typeof StatusIdEnum]

export const StatusEnum = {
  SUBMITTED: 'Innsent',
  IN_PROGRESS: 'Í vinnslu',
  READY_FOR_PUBLICATION: 'Tilbúið til útgáfu',
  PUBLISHED: 'Útgefið',
  REJECTED: 'Hafnað',
  REVOKED: 'Afturkallað',
} as const

export type StatusEnum = (typeof StatusEnum)[keyof typeof StatusEnum]

export enum QueryParams {
  SEARCH = 'search',
  STATUS = 'statusId',
  TYPE = 'typeId',
  CATEGORY = 'categoryId',
  PUBLICATION = 'publication',
  PAGE = 'page',
  PAGE_SIZE = 'pageSize',
  DATE_FROM = 'dateFrom',
  DATE_TO = 'dateTo',
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
  UTGAFA = '/ritstjorn?tab=utgafa',
  HEILDARYFIRLIT = '/heildaryfirlit',
  LOGIN = '/innskraning',
}

export const Routes: RouteItem[] = [
  {
    path: Route.STJORNBORD,
    pathName: 'Umsýslukerfi',
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

export const RecallAdvertTypes = [
  AdvertTemplateType.RECALLBANKRUPTCY,
  AdvertTemplateType.RECALLDECEASED,
]

export const DivisionMeetingAdvertTypes = [
  AdvertTemplateType.DIVISIONMEETINGBANKRUPTCY,
  AdvertTemplateType.DIVISIONMEETINGDECEASED,
  AdvertTemplateType.RECALLBANKRUPTCY,
  AdvertTemplateType.RECALLDECEASED,
]
