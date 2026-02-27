import type { AppRouter } from './server/routers/_app'

import type { inferRouterOutputs } from '@trpc/server'

type RouterOutputs = inferRouterOutputs<AppRouter>

export type ApplicationDetails = RouterOutputs['getApplicationById']

export type ApplicationsListResult = RouterOutputs['getApplications']
export type ApplicationListItem = ApplicationsListResult['applications'][number]
export type ApplicationsPaging = ApplicationsListResult['paging']

export type ApplicationAdvert = NonNullable<
  ApplicationDetails['adverts']
>[number]

export type AdvertPublicationDetails = RouterOutputs['getAdvertPublication']
